import NursePage from "../NursePage";
import { NurseQueueView } from "./NurseQueue";

export function NursePatientsInTriageView(props) {
  return <NurseQueueView {...props} mode="patientsInTriage" />;
}

export default function NursePatientsInTriage() {
  return <NursePage forcedView="patientsInTriage" />;
}
