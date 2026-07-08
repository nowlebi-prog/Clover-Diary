import PageHeader from "../../components/layout/PageHeader";
import CrudPanel from "../shared/CrudPanel";
import { createImportantFile, deleteImportantFile, getImportantFiles, updateImportantFile } from "../../lib/storage/localStorageAdapter";

export default function FilesPage() {
  return (
    <>
      <PageHeader eyebrow="Files" title="중요 파일과 링크" />
      <CrudPanel
        title="파일/링크"
        description="1차 MVP는 실제 파일을 저장하지 않고 파일명, 메모, 외부 링크 중심으로 관리합니다."
        getItems={getImportantFiles}
        createItem={createImportantFile}
        updateItem={updateImportantFile}
        deleteItem={deleteImportantFile}
        completedField="archived"
        fields={[
          { name: "name", label: "파일명", primary: true },
          { name: "category", label: "카테고리", type: "select", options: ["계약서", "정산", "참고자료", "이미지", "포트폴리오", "기타"] },
          { name: "url", label: "링크 URL" },
          { name: "project", label: "관련 프로젝트" },
          { name: "important", label: "중요", type: "checkbox" },
          { name: "memo", label: "메모", type: "textarea" }
        ]}
      />
    </>
  );
}
