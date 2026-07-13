import PageHeader from "../../components/layout/PageHeader";
import WorkLogPanel from "../daily/WorkLogPanel";

export default function WorkLogPage() {
  return (
    <>
      <PageHeader eyebrow="WORK" title="업무일지" />
      <WorkLogPanel />
    </>
  );
}
