import { state, setState } from "./state.js";
import { trainingBlocks } from "./blocks.js";
import { demoAthletes, demoDevelopmentProfiles, demoPhysicalProfiles } from "../data/demoAthletes.js";
import { demoEvents, demoWeeks, demoReadiness } from "../data/demoEvents.js";
import { generateSession } from "./engine/sessionBuilder.js";
import { renderApp } from "./ui/profileView.js";

function bootstrap() {
  setState({
    athletes: demoAthletes,
    developmentProfiles: demoDevelopmentProfiles,
    physicalProfiles: demoPhysicalProfiles,
    events: demoEvents,
    weeks: demoWeeks,
    readiness: demoReadiness,
    blocks: trainingBlocks
  });

  const session = generateSession({ state });
  renderApp(state, session);
}

bootstrap();
