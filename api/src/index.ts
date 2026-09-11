import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

initializeApp();

const db = getFirestore();

setGlobalOptions({
  maxInstances: 10,
});

export const api = onRequest(
  {
    cors: true,
  },
  async (request, response) => {
    try {
      // POST /movies/import
if (
  request.method === "POST" &&
  request.path === "/movies/import"
) {
  // Bu endpoint yalnız lokal emulator üçün işləsin.
  if (process.env.FUNCTIONS_EMULATOR !== "true") {
    response.status(403).json({
      message: "Import is only allowed in local emulator",
    });
    return;
  }

  const movies = request.body?.movies;

  if (!Array.isArray(movies)) {
    response.status(400).json({
      message: "movies array is required",
    });
    return;
  }

  const batch = db.batch();

  for (const movie of movies) {
    if (typeof movie.tmdbId !== "number") {
      continue;
    }

    const movieRef = db
      .collection("movies")
      .doc(`tmdb-${movie.tmdbId}`);

    batch.set(
      movieRef,
      movie,
      {merge: true}
    );
  }

  await batch.commit();

  response.status(200).json({
    message: "Movies imported successfully",
    count: movies.length,
  });

  return;
}
      // GET /movies
      if (request.method === "GET" && request.path === "/movies") {
        const status =
          typeof request.query.status === "string"
            ? request.query.status
            : undefined;

        if (
          status &&
          status !== "now_playing" &&
          status !== "upcoming"
        ) {
          response.status(400).json({
            message: "Invalid movie status",
          });
          return;
        }

        const snapshot = status
          ? await db
              .collection("movies")
              .where("status", "==", status)
              .get()
          : await db
              .collection("movies")
              .get();

        const movies = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        response.status(200).json(movies);
        return;
      }

      response.status(404).json({
        message: "Endpoint not found",
      });
    } catch (error) {
      console.error("API error:", error);

      response.status(500).json({
        message: "Internal server error",
      });
    }
  }
);