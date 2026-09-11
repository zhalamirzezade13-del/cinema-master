import type { AdminRecord } from './admin-data.service';

// UI-only fixtures: never create authentication accounts or reserve real seats.
const customers = [
  ['Aysel Məmmədova', 'aysel.mammadova'],
  ['Murad Əliyev', 'murad.aliyev'],
  ['Nigar Hüseynova', 'nigar.huseynova'],
  ['Elvin Qasımov', 'elvin.gasimov'],
  ['Leyla Rzayeva', 'leyla.rzayeva'],
  ['Orxan İsmayılov', 'orkhan.ismayilov'],
  ['Fidan Abbasova', 'fidan.abbasova'],
  ['Tural Həsənov', 'tural.hasanov']
];

export type DemoSection = 'users' | 'bookings' | 'comments' | 'messages';

export function demoRecords(section: DemoSection): AdminRecord[] {
  const now = new Date();
  const dateAt = (days: number, hour = 15): string => {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() + days);
    date.setUTCHours(hour, 0, 0, 0);
    return date.toISOString();
  };
  const users: AdminRecord[] = customers.map(([name, email], index) => ({
    id: `demo-user-${index + 1}`,
    name,
    email: `${email}@example.com`,
    role: index === 0 ? 'admin' : 'user',
    createdAt: dateAt(-90 + index * 9),
  }));
  if (section === 'users') return users;

  const movies = ['Interstellar', 'Dune: Part Two', 'Inside Out 2', 'Inception', 'The Batman', 'Oppenheimer'];
  if (section === 'comments') {
    const comments = [
      'Musiqi və kosmos səhnələri möhtəşəm idi. Böyük ekranda izləməyə dəyər!',
      'Vizual effektlər və səs çox təsirli idi. IMAX-da yenidən baxardım.',
      'Ailəlikcə izlədik, çox bəyəndik. Həm əyləncəli, həm də duyğulu film idi.',
      'Süjet sona qədər maraqlı saxladı. Final haqqında hələ də düşünürəm.',
      'Filmin atmosferini çox bəyəndim, bəzi səhnələr bir az uzun idi.',
      'Aktyor oyunu əla idi. Dialoqları diqqətlə izləmək lazımdır.',
      'İkinci dəfə baxdım və yeni detallar gördüm. Sevdiyim filmlərdəndir.',
      'Səs keyfiyyəti çox yaxşı idi, zalda izləmək tamam başqa hissdir.'
    ];
    return users.map((user, index) => ({
      id: `demo-comment-${index + 1}`,
      userId: user.id,
      authorName: user['name'],
      email: user['email'],
      movieTitle: movies[index % movies.length],
      text: comments[index],
      rating: [10, 9, 9, 10, 7, 8, 10, 9][index],
      status: ['approved', 'approved', 'pending', 'approved', 'hidden', 'approved', 'pending', 'approved'][index],
      createdAt: dateAt(-8 + index, 9 + index),
    }));
  }
  if (section === 'messages') {
    const messages = [
      ['IMAX seansları', 'Salam, həftəsonu Interstellar üçün əlavə IMAX seansı olacaq?'],
      ['Rezervasiya dəyişikliyi', 'Rezervasiyamı axşam seansına keçirmək mümkündür?'],
      ['Uşaq bileti', 'Salam, ailəlikcə gəlmək istəyirik. Uşaqlar üçün bilet endirimi varmı?'],
      ['İtirilmiş əşya', 'Dünənki seansdan sonra zalda eynəyimi unutmuşam. Tapılıbsa, məlumat verə bilərsiniz?'],
      ['Seansın dili', 'The Batman filmi orijinal dildə və altyazı ilə göstərilir?'],
      ['Ödəniş haqqında', 'Bilet alarkən ödənişi kinoteatrın kassasında etmək mümkündür?'],
      ['Təşəkkür', 'Dünənki nümayiş və əməkdaşların köməyi üçün təşəkkür edirəm. Çox razı qaldıq!'],
      ['Qrup rezervasiyası', 'Salam, 10 nəfərlik qrup üçün yanaşı yerlər rezerv etmək istəyirik. Necə müraciət edək?']
    ];
    return users.map((user, index) => ({
      id: `demo-message-${index + 1}`,
      userId: user.id,
      name: user['name'],
      email: user['email'],
      subject: messages[index][0],
      message: messages[index][1],
      read: index % 3 === 0,
      createdAt: dateAt(-7 + index, 7 + index),
    }));
  }
  const statuses = ['paid', 'confirmed', 'pending', 'paid', 'cancelled', 'confirmed'];
  return Array.from({ length: 12 }, (_, index) => {
    const user = users[index % users.length];
    const status = statuses[index % statuses.length];
    const seats = index % 3 === 0 ? [5, 6, 7] : [8, 9];
    return {
      id: `demo-booking-${String(index + 1).padStart(4, '0')}`,
      userId: user.id,
      customerName: user['name'],
      email: user['email'],
      movieTitle: movies[index % movies.length],
      hallName: index % 3 === 0 ? 'IMAX' : `Zal ${index % 3 + 1}`,
      startsAt: dateAt(index - 3, 12 + index % 6),
      createdAt: dateAt(-14 + index, 8),
      row: index % 6 + 3,
      seats,
      total: seats.length * (index % 3 === 0 ? 18 : 12),
      status,
      paymentStatus: status === 'paid' ? 'paid' : status === 'cancelled' ? 'cancelled' : 'pending',
    };
  });
}
