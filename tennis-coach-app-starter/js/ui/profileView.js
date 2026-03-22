export function renderApp(state, session) {
  const root = document.getElementById("app");
  if (!root) return;

  const athlete = state.athletes.find((a) => a.id === state.activeAthleteId);
  const readiness = state.readiness.find((r) => r.athleteId === state.activeAthleteId);

  root.innerHTML = `
    <div class="container">
      <h1>Tennis Coach App</h1>
      <section class="card">
        <h2>Profil actif</h2>
        <p><strong>${athlete.firstName} ${athlete.lastName}</strong> — ${athlete.profileType} — ${athlete.level}</p>
      </section>

      <section class="card">
        <h2>Readiness du jour</h2>
        <p>Fatigue : ${readiness?.fatigueLevel ?? "-"}/5</p>
        <p>Motivation : ${readiness?.motivationLevel ?? "-"}/5</p>
        <p>Temps disponible : ${readiness?.availabilityMinutes ?? 60} min</p>
      </section>

      <section class="card">
        <h2>Séance du jour</h2>
        <p><strong>Rôle :</strong> ${session.sessionRole}</p>
        <p><strong>Objectif :</strong> ${session.mainObjective}</p>
        <p><strong>Charge prévue :</strong> ${session.expectedLoad}</p>
        <p><strong>Blocs :</strong></p>
        <ul>
          ${session.blocks.map((b) => `<li>${b.name}</li>`).join("")}
        </ul>
        <p><strong>Explication :</strong> ${session.explanation}</p>
      </section>
    </div>
  `;
}
