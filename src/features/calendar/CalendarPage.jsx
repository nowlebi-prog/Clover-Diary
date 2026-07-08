import CrudPanel from "../shared/CrudPanel";
import PageHeader from "../../components/layout/PageHeader";
import { createEvent, deleteEvent, getEvents, updateEvent } from "../../lib/storage/localStorageAdapter";

export default function CalendarPage() {
  return (
    <>
      <PageHeader eyebrow="Calendar" title="월간 일정" />
      <CrudPanel
        title="일정"
        description="개인, 업무, 콘텐츠, 체험단, 정산 일정을 날짜 기준으로 관리해요."
        getItems={getEvents}
        createItem={createEvent}
        updateItem={updateEvent}
        deleteItem={deleteEvent}
        defaultItem={{ date: new Date().toISOString().slice(0, 10), category: "개인" }}
        fields={[
          { name: "title", label: "제목", primary: true },
          { name: "date", label: "날짜", type: "date" },
          { name: "time", label: "시간", type: "time" },
          { name: "category", label: "카테고리", type: "select", options: ["개인", "업무", "콘텐츠", "체험단", "정산", "기타"] },
          { name: "memo", label: "메모", type: "textarea" }
        ]}
      />
    </>
  );
}
