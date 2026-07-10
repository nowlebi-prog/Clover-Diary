import CrudPanel from "../shared/CrudPanel";
import PageHeader from "../../components/layout/PageHeader";
import { createContentPlan, deleteContentPlan, getContentPlans, updateContentPlan } from "../../lib/storage/localStorageAdapter";

export default function ContentPage() {
  return (
    <>
      <PageHeader eyebrow="WORK / CONTENT" title="콘텐츠 발행 계획" />
      <CrudPanel
        title="채널별 콘텐츠"
        description="인스타, 블로그, 유튜브 등 채널별 발행 계획을 모아봅니다."
        getItems={getContentPlans}
        createItem={createContentPlan}
        updateItem={updateContentPlan}
        deleteItem={deleteContentPlan}
        fields={[
          { name: "title", label: "콘텐츠 제목", primary: true },
          { name: "channel", label: "채널", type: "select", options: ["인스타", "블로그", "유튜브", "릴스", "기타"] },
          { name: "weeklyGoal", label: "이번 주 목표" },
          { name: "publishDate", label: "발행 예정일", type: "date" },
          { name: "status", label: "상태", type: "select", options: ["아이디어", "기획중", "작성중", "완료", "발행완료", "대기"] },
          { name: "link", label: "링크" },
          { name: "memo", label: "메모", type: "textarea" }
        ]}
      />
    </>
  );
}
