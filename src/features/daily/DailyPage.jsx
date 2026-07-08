import CrudPanel from "../shared/CrudPanel";
import PageHeader from "../../components/layout/PageHeader";
import { createTimelineEntry, deleteTimelineEntry, getTimelineEntries, updateTimelineEntry } from "../../lib/storage/localStorageAdapter";

export default function DailyPage() {
  return (
    <>
      <PageHeader eyebrow="Daily" title="데일리 타임라인" />
      <CrudPanel
        title="오늘의 기록"
        description="시간대별 기록, 컨디션, 회고를 자유롭게 쌓아두는 공간입니다."
        getItems={getTimelineEntries}
        createItem={createTimelineEntry}
        updateItem={updateTimelineEntry}
        deleteItem={deleteTimelineEntry}
        defaultItem={{ date: new Date().toISOString().slice(0, 10), time: "09:00" }}
        fields={[
          { name: "title", label: "제목", primary: true },
          { name: "date", label: "날짜", type: "date" },
          { name: "time", label: "시간", type: "time" },
          { name: "mood", label: "컨디션", type: "select", options: ["좋음", "보통", "피곤", "정신없음", "회복 필요"] },
          { name: "memo", label: "기록", type: "textarea" }
        ]}
      />
    </>
  );
}
