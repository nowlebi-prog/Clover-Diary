import CrudPanel from "../shared/CrudPanel";
import PageHeader from "../../components/layout/PageHeader";
import { createContentPlan, deleteContentPlan, getContentPlans, updateContentPlan } from "../../lib/storage/localStorageAdapter";

export default function ArchivePage() {
  return (
    <>
      <PageHeader eyebrow="Archive" title="아이디어와 콘텐츠 보관함" />
      <CrudPanel
        title="콘텐츠 발행 캘린더"
        description="채널, 상태, 발행 예정일 기준으로 콘텐츠 계획을 모아봅니다."
        getItems={getContentPlans}
        createItem={createContentPlan}
        updateItem={updateContentPlan}
        deleteItem={deleteContentPlan}
        fields={[
          { name: "title", label: "콘텐츠 제목", primary: true },
          { name: "channel", label: "채널", type: "select", options: ["인스타", "스레드", "블로그", "유튜브", "기타"] },
          { name: "weeklyGoal", label: "이번 주 올릴 것" },
          { name: "publishDate", label: "발행 예정일", type: "date" },
          { name: "status", label: "상태", type: "select", options: ["아이디어", "기획중", "작성중", "완료", "발행완료", "대기", "미완료"] },
          { name: "link", label: "링크" },
          { name: "memo", label: "메모", type: "textarea" }
        ]}
      />
    </>
  );
}
