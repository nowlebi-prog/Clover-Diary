import { Link } from "react-router-dom";
import AppButton from "../../components/common/AppButton";
import PageHeader from "../../components/layout/PageHeader";
import { createTimelineEntry, deleteTimelineEntry, getTimelineEntries, updateTimelineEntry } from "../../lib/storage/localStorageAdapter";
import CrudPanel from "../shared/CrudPanel";

export default function DailyPage() {
  return (
    <>
      <PageHeader eyebrow="Daily" title="Daily timeline">
        <Link to="/habits"><AppButton variant="soft">Habits</AppButton></Link>
      </PageHeader>
      <CrudPanel
        title="Today notes"
        description="Write time blocks, mood, reflections, and loose notes for the day."
        getItems={getTimelineEntries}
        createItem={createTimelineEntry}
        updateItem={updateTimelineEntry}
        deleteItem={deleteTimelineEntry}
        defaultItem={{ date: new Date().toISOString().slice(0, 10), time: "09:00" }}
        fields={[
          { name: "title", label: "Title", primary: true },
          { name: "date", label: "Date", type: "date" },
          { name: "time", label: "Time", type: "time" },
          { name: "mood", label: "Mood", type: "select", options: ["Good", "Normal", "Tired", "Scattered", "Need rest"] },
          { name: "memo", label: "Note", type: "textarea" }
        ]}
      />
    </>
  );
}
