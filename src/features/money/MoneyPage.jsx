import PageHeader from "../../components/layout/PageHeader";
import CrudPanel from "../shared/CrudPanel";
import { createPayment, deletePayment, getPayments, updatePayment } from "../../lib/storage/localStorageAdapter";

export default function MoneyPage() {
  return (
    <>
      <PageHeader eyebrow="Money" title="입금/정산 체크" />
      <CrudPanel
        title="프로젝트 정산"
        description="미입금 항목은 대시보드와 목록에서 빨간 배지로 표시됩니다."
        getItems={getPayments}
        createItem={createPayment}
        updateItem={updatePayment}
        deleteItem={deletePayment}
        completedField="paid"
        fields={[
          { name: "project", label: "프로젝트명", primary: true },
          { name: "client", label: "클라이언트명" },
          { name: "amount", label: "금액", type: "number" },
          { name: "status", label: "상태", type: "select", options: ["견적 전", "계약금 완료", "진행중", "요금 미입금", "입금 완료", "보류", "미입금"] },
          { name: "expectedDate", label: "입금 예정일", type: "date" },
          { name: "paidDate", label: "실제 입금일", type: "date" },
          { name: "memo", label: "메모", type: "textarea" }
        ]}
      />
    </>
  );
}
