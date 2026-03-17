import NursePage from "../NursePage";
import { NurseNewTriageView } from "./NurseNewTriage";

export function NurseQuickSearchView(props) {
  return <NurseNewTriageView {...props} viewMode="quickSearch" />;
}

export default function NurseQuickSearch() {
  return <NursePage forcedView="quickSearch" />;
}
