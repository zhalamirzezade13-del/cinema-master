import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, ViewChild } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

type VipSeat = { row: number; number: number };
type CameraView = '3d' | 'seat' | 'stage';

@Component({
  selector: 'app-vip-theatre-view',
  imports: [CommonModule, TranslocoPipe],
  template: `
    <div class="vip-viewport" #viewport>
      <div class="vip-hint" *ngIf="hoveredSeat" [style.left.px]="hintX" [style.top.px]="hintY">
        {{ 'theatre.row' | transloco }} {{ hoveredSeat.row }}, {{ 'theatre.seat' | transloco }} {{ hoveredSeat.number }}
        <strong>{{ seatPrice(hoveredSeat.row) }} ₼</strong>
      </div>
      <div class="vip-camera-label" *ngIf="mode === 'stage' && focusedSeat">
        {{ 'theatre.viewFromSeat' | transloco }} · {{ 'theatre.row' | transloco }} {{ focusedSeat.row }}, {{ 'theatre.seat' | transloco }} {{ focusedSeat.number }}
      </div>
    </div>
  `,
  styles: [`
    .vip-viewport { position: relative; width: 100%; height: clamp(440px, 58vw, 690px); overflow: hidden; border-radius: 16px; background: #211712; }
    .vip-viewport canvas { display: block; width: 100%; height: 100%; touch-action: manipulation; }
    .vip-hint, .vip-camera-label { position: absolute; z-index: 2; padding: 9px 13px; color: #2c211b; font-size: 13px; font-weight: 700; border-radius: 10px; background: #fffaf1; box-shadow: 0 6px 20px #0007; pointer-events: none; }
    .vip-hint { transform: translate(12px, -110%); white-space: nowrap; }
    .vip-hint strong { display: block; margin-top: 3px; font-size: 17px; }
    .vip-camera-label { left: 14px; bottom: 14px; }
  `]
})
export class VipTheatreViewComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('viewport', { static: true }) viewport!: ElementRef<HTMLDivElement>;
  @Input() mode: CameraView = '3d';
  @Input() focusedSeat: VipSeat | null = null;
  @Input() selectedSeats: VipSeat[] = [];
  @Input() occupiedSeats: ReadonlySet<string> = new Set();
  @Output() seatPicked = new EventEmitter<VipSeat>();
  @Output() unavailable = new EventEmitter<void>();

  hoveredSeat: VipSeat | null = null;
  hintX = 0;
  hintY = 0;

  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private resizeObserver?: ResizeObserver;
  private frame = 0;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly cameraLook = new THREE.Vector3();
  private readonly hitTargets: THREE.Mesh[] = [];
  private readonly upholstery = new Map<string, THREE.MeshStandardMaterial>();
  private woodTexture?: THREE.CanvasTexture;
  private fabricTexture?: THREE.CanvasTexture;

  constructor(private readonly zone: NgZone) {}

  ngAfterViewInit(): void {
    try {
      this.zone.runOutsideAngular(() => {
        this.createScene();
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(this.viewport.nativeElement);
        this.renderer!.domElement.addEventListener('pointermove', this.onPointerMove);
        this.renderer!.domElement.addEventListener('pointerleave', this.onPointerLeave);
        this.renderer!.domElement.addEventListener('click', this.onClick);
        this.resize();
        this.updateSeatColors();
        this.moveCamera(false);
      });
    } catch (error) {
      console.warn('VIP 3D view is unavailable:', error);
      this.unavailable.emit();
    }
  }

  ngOnChanges(): void {
    if (!this.renderer) return;
    this.updateSeatColors();
    this.zone.runOutsideAngular(() => this.moveCamera(true));
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    const canvas = this.renderer?.domElement;
    canvas?.removeEventListener('pointermove', this.onPointerMove);
    canvas?.removeEventListener('pointerleave', this.onPointerLeave);
    canvas?.removeEventListener('click', this.onClick);
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    this.scene?.traverse(object => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
      }
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    this.woodTexture?.dispose();
    this.fabricTexture?.dispose();
    this.renderer?.dispose();
    canvas?.remove();
  }

  seatPrice(row: number): number {
    if (row <= 2) return 50;
    if (row <= 4) return 45;
    if (row <= 6) return 40;
    return 35;
  }

  private createScene(): void {
    const viewport = this.viewport.nativeElement;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.45;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    viewport.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#1c1412');
    this.scene.fog = new THREE.Fog('#251a17', 19, 43);
    this.camera = new THREE.PerspectiveCamera(68, 1, 0.08, 90);
    this.camera.position.set(0, 6.2, 11.5);
    this.cameraLook.set(0, 1.6, -2.4);
    this.camera.lookAt(this.cameraLook);

    this.scene.add(new THREE.AmbientLight(0xffe2c7, 1.15));
    const mainLight = new THREE.DirectionalLight(0xffefd9, 3.1);
    mainLight.position.set(-2, 9, 2);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.set(1024, 1024);
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 13;
    mainLight.shadow.camera.bottom = -13;
    mainLight.shadow.camera.near = 1;
    mainLight.shadow.camera.far = 30;
    this.scene.add(mainLight);
    const screenLight = new THREE.PointLight(0xffdbad, 90, 18);
    screenLight.position.set(0, 3.8, -8.8);
    this.scene.add(screenLight);
    for (const x of [-5, 0, 5]) {
      const light = new THREE.PointLight(0xffb66f, 24, 12);
      light.position.set(x, 6.2, 1);
      this.scene.add(light);
    }

    this.buildRoom();
    this.buildSeats();
  }

  private buildRoom(): void {
    const wood = this.createWoodTexture();
    const woodMaterial = new THREE.MeshStandardMaterial({ map: wood, color: 0xb7815a, roughness: 0.82 });
    const woodDark = new THREE.MeshStandardMaterial({ color: 0x4a2e26, roughness: 0.85 });
    const carpet = new THREE.MeshStandardMaterial({ color: 0x3b2528, roughness: 1 });
    const step = new THREE.MeshStandardMaterial({ color: 0x9a7353, roughness: 0.88 });
    const trim = new THREE.MeshStandardMaterial({ color: 0xc49462, metalness: 0.22, roughness: 0.52 });
    this.box(16.8, 0.28, 23, carpet, 0, -0.34, 0).receiveShadow = true;
    this.box(17, 7.8, 0.3, woodMaterial, 0, 3.5, -10.9);
    for (const x of [-8.3, 8.3]) {
      this.box(0.3, 7.7, 23, woodMaterial, x, 3.5, 0);
      this.box(0.14, 0.12, 23, trim, x + (x < 0 ? .2 : -.2), 3.0, 0);
    }
    this.box(17, 0.25, 23, woodDark, 0, 7.4, 0);
    for (let z = -10; z <= 10; z += 1.4) {
      this.box(17, 0.18, 0.38, woodMaterial, 0, 7.1, z);
    }
    for (let x = -7; x <= 7; x += 2.4) {
      this.box(0.12, 0.1, 22, trim, x, 7.0, 0);
    }
    for (let row = 8; row >= 1; row--) {
      const y = this.seatY(row);
      const z = this.seatZ(row);
      const platform = this.box(15.2, 0.21 + y, 1.37, row % 2 ? woodDark : carpet, 0, (y - 0.21) / 2, z);
      platform.receiveShadow = true;
      for (const x of [-2.25, 2.25]) {
        const stair = this.box(0.84, 0.13, 1.34, step, x, y - .04, z);
        stair.receiveShadow = true;
        this.box(0.84, 0.035, 0.1, trim, x, y + .04, z + .63);
      }
    }
    this.box(15.2, 0.5, 3.1, woodMaterial, 0, 0.12, -9.2).receiveShadow = true;
    this.box(15.2, 0.17, 0.16, trim, 0, 0.43, -7.63);
    const curtain = new THREE.MeshStandardMaterial({ color: 0x602c32, roughness: 0.95 });
    this.box(13.8, 5.55, 0.2, woodDark, 0, 3.55, -10.66);
    this.box(12.55, 4.95, 0.08, woodMaterial, 0, 3.55, -10.52);
    for (let x = -5.8; x <= 5.8; x += 1.45) {
      this.box(0.05, 4.8, 0.12, trim, x, 3.55, -10.43);
    }
    for (const side of [-1, 1]) {
      for (let index = 0; index < 5; index++) {
        this.box(0.27, 5.05, 0.32, curtain, side * (6.15 + index * .22), 3.5, -10.05 + index * .13);
      }
    }
    this.box(15.1, 0.38, 0.55, woodDark, 0, 6.37, -10.45);
    this.box(15.1, 0.07, 0.58, trim, 0, 6.12, -10.44);
  }

  private buildSeats(): void {
    const fabricTexture = this.createFabricTexture();
    const backShape = new RoundedBoxGeometry(0.69, 0.96, 0.24, 3, 0.085);
    const cushionShape = new RoundedBoxGeometry(0.67, 0.18, 0.55, 3, 0.07);
    const armShape = new RoundedBoxGeometry(0.1, 0.18, 0.7, 2, 0.035);
    const legShape = new THREE.BoxGeometry(0.08, 0.33, 0.08);
    const hitShape = new THREE.BoxGeometry(0.83, 1.18, 0.9);
    const frame = new THREE.MeshStandardMaterial({ color: 0x272323, metalness: 0.28, roughness: 0.68 });
    const arm = new THREE.MeshStandardMaterial({ color: 0x39302b, roughness: 0.58 });
    const transparent = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

    for (let row = 8; row >= 1; row--) {
      for (let number = 1; number <= 12; number++) {
        const x = this.seatX(number);
        const y = this.seatY(row);
        const z = this.seatZ(row);
        const key = `${row}-${number}`;
        const fabric = new THREE.MeshStandardMaterial({ color: this.seatColor(row, number), roughness: 0.94, bumpMap: fabricTexture, bumpScale: 0.025 });
        this.upholstery.set(key, fabric);
        const back = new THREE.Mesh(backShape, fabric);
        back.position.set(x, y + .82, z + .25);
        back.rotation.x = -.075;
        back.castShadow = true;
        this.scene!.add(back);
        const backing = new THREE.Mesh(backShape, frame);
        backing.scale.set(1.09, 1.04, .55);
        backing.position.set(x, y + .82, z + .16);
        backing.castShadow = true;
        this.scene!.add(backing);
        const cushion = new THREE.Mesh(cushionShape, fabric);
        cushion.position.set(x, y + .38, z - .15);
        cushion.castShadow = true;
        this.scene!.add(cushion);
        for (const side of [-1, 1]) {
          const armrest = new THREE.Mesh(armShape, arm);
          armrest.position.set(x + side * .39, y + .5, z + .02);
          armrest.castShadow = true;
          this.scene!.add(armrest);
          const leg = new THREE.Mesh(legShape, frame);
          leg.position.set(x + side * .3, y + .17, z + .19);
          this.scene!.add(leg);
        }
        const hit = new THREE.Mesh(hitShape, transparent);
        hit.position.set(x, y + .67, z + .08);
        hit.userData['row'] = row;
        hit.userData['number'] = number;
        this.hitTargets.push(hit);
        this.scene!.add(hit);
      }
    }
  }

  private box(width: number, height: number, depth: number, material: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    this.scene!.add(mesh);
    return mesh;
  }

  private createWoodTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#87583d';
    context.fillRect(0, 0, 256, 256);
    for (let index = 0; index < 90; index++) {
      const x = (index * 73) % 256;
      context.fillStyle = index % 3 === 0 ? '#a77451' : '#6f422e';
      context.globalAlpha = 0.12 + (index % 4) * .06;
      context.fillRect(x, 0, index % 5 === 0 ? 3 : 1, 256);
    }
    context.globalAlpha = 1;
    this.woodTexture = new THREE.CanvasTexture(canvas);
    this.woodTexture.colorSpace = THREE.SRGBColorSpace;
    this.woodTexture.wrapS = this.woodTexture.wrapT = THREE.RepeatWrapping;
    this.woodTexture.repeat.set(4, 2);
    return this.woodTexture;
  }

  private createFabricTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const context = canvas.getContext('2d')!;
    const image = context.createImageData(128, 128);
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        const value = 105 + (x * 17 + y * 29 + x * y * 3) % 70;
        const offset = (y * 128 + x) * 4;
        image.data[offset] = image.data[offset + 1] = image.data[offset + 2] = value;
        image.data[offset + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);
    this.fabricTexture = new THREE.CanvasTexture(canvas);
    this.fabricTexture.wrapS = this.fabricTexture.wrapT = THREE.RepeatWrapping;
    this.fabricTexture.repeat.set(2, 3);
    return this.fabricTexture;
  }

  private seatX(number: number): number {
    return (number - 6.5) * .88 + (number > 4 ? .7 : 0) + (number > 8 ? .7 : 0) - .7;
  }
  private seatY(row: number): number { return (8 - row) * .18; }
  private seatZ(row: number): number { return -5.2 + (8 - row) * 1.35; }

  private seatColor(row: number, number: number): number {
    if (this.occupiedSeats.has(`3-${row}-${number}`)) return 0x777579;
    if (row <= 2) return number % 4 === 0 ? 0x334582 : 0xa6a1a0;
    if (row <= 4) return number % 3 === 0 ? 0xc32858 : 0xa6a1a0;
    if (row <= 6) return number % 4 === 0 ? 0x148e82 : 0xaaa5a1;
    return number % 3 === 0 ? 0xb72d4d : 0xa9a5a2;
  }

  private updateSeatColors(): void {
    for (const [key, material] of this.upholstery) {
      const [row, number] = key.split('-').map(Number);
      const selected = this.selectedSeats.some(seat => seat.row === row && seat.number === number);
      material.color.setHex(selected ? 0xf28a38 : this.seatColor(row, number));
    }
    this.render();
  }

  private moveCamera(animated: boolean): void {
    if (!this.camera) return;
    const seat = this.focusedSeat;
    const targetPosition = new THREE.Vector3(0, 6.2, 11.5);
    const targetLook = new THREE.Vector3(0, 1.6, -2.4);
    if (seat && this.mode === 'seat') {
      const x = this.seatX(seat.number);
      const y = this.seatY(seat.row);
      const z = this.seatZ(seat.row);
      targetPosition.set(x, y + 1.42, z + 1.22);
      targetLook.set(x, y + .7, z + .13);
    } else if (seat && this.mode === 'stage') {
      const x = this.seatX(seat.number);
      targetPosition.set(x, this.seatY(seat.row) + 1.9, this.seatZ(seat.row) - .18);
      targetLook.set(0, 3.55, -10.55);
    }
    cancelAnimationFrame(this.frame);
    if (!animated || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.camera.position.copy(targetPosition);
      this.cameraLook.copy(targetLook);
      this.camera.lookAt(this.cameraLook);
      this.render();
      return;
    }
    const startPosition = this.camera.position.clone();
    const startLook = this.cameraLook.clone();
    const started = performance.now();
    const step = (now: number): void => {
      const progress = Math.min(1, (now - started) / 950);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.camera!.position.lerpVectors(startPosition, targetPosition, eased);
      this.cameraLook.lerpVectors(startLook, targetLook, eased);
      this.camera!.lookAt(this.cameraLook);
      this.render();
      if (progress < 1) this.frame = requestAnimationFrame(step);
    };
    this.frame = requestAnimationFrame(step);
  }

  private resize(): void {
    if (!this.renderer || !this.camera) return;
    const { width, height } = this.viewport.nativeElement.getBoundingClientRect();
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.render();
  }

  private render(): void {
    if (this.renderer && this.scene && this.camera) this.renderer.render(this.scene, this.camera);
  }

  private pickedSeat(event: PointerEvent | MouseEvent): VipSeat | null {
    if (!this.renderer || !this.camera) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.hitTargets, false)[0];
    return hit ? { row: hit.object.userData['row'] as number, number: hit.object.userData['number'] as number } : null;
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (this.mode === 'stage') return;
    const seat = this.pickedSeat(event);
    const available = seat && !this.occupiedSeats.has(`3-${seat.row}-${seat.number}`);
    this.renderer!.domElement.style.cursor = available ? 'pointer' : 'default';
    this.zone.run(() => {
      this.hoveredSeat = available ? seat : null;
      this.hintX = event.offsetX;
      this.hintY = event.offsetY;
    });
  };
  private readonly onPointerLeave = (): void => {
    this.zone.run(() => { this.hoveredSeat = null; });
  };
  private readonly onClick = (event: MouseEvent): void => {
    if (this.mode === 'stage') return;
    const seat = this.pickedSeat(event);
    if (seat && !this.occupiedSeats.has(`3-${seat.row}-${seat.number}`)) {
      this.zone.run(() => {
        this.hoveredSeat = null;
        this.seatPicked.emit(seat);
      });
    }
  };
}
