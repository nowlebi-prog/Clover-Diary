import PageHeader from "../../components/layout/PageHeader";
import CrudPanel from "../shared/CrudPanel";
import { createCampaign, createCampaignParticipant, deleteCampaign, deleteCampaignParticipant, getCampaignParticipants, getCampaigns, updateCampaign, updateCampaignParticipant } from "../../lib/storage/localStorageAdapter";

export default function CampaignsPage() {
  return (
    <>
      <PageHeader eyebrow="Campaigns" title="체험단 관리" />
      <div className="grid gap-4">
        <CrudPanel title="캠페인" getItems={getCampaigns} createItem={createCampaign} updateItem={updateCampaign} deleteItem={deleteCampaign} fields={[{ name: "name", label: "캠페인명", primary: true }, { name: "brand", label: "브랜드" }, { name: "product", label: "제품/서비스" }, { name: "recruits", label: "모집 인원", type: "number" }, { name: "benefit", label: "제공 혜택" }, { name: "applyDueDate", label: "신청 마감일", type: "date" }, { name: "uploadDueDate", label: "업로드 마감일", type: "date" }, { name: "status", label: "상태", type: "select", options: ["모집중", "선정중", "진행중", "업로드대기", "완료", "보류"] }, { name: "memo", label: "메모", type: "textarea" }]} />
        <CrudPanel title="참여자" getItems={getCampaignParticipants} createItem={createCampaignParticipant} updateItem={updateCampaignParticipant} deleteItem={deleteCampaignParticipant} fields={[{ name: "name", label: "이름/닉네임", primary: true }, { name: "campaignId", label: "캠페인 ID" }, { name: "instagram", label: "인스타그램 ID" }, { name: "blogUrl", label: "블로그 URL" }, { name: "contact", label: "연락처" }, { name: "appliedDate", label: "신청일", type: "date" }, { name: "selectedStatus", label: "선정 여부", type: "select", options: ["미확정", "선정", "미선정", "예비"] }, { name: "shippingStatus", label: "발송 여부", type: "select", options: ["미발송", "발송완료", "수령완료"] }, { name: "uploadStatus", label: "업로드 여부", type: "select", options: ["미업로드", "업로드완료", "수정요청", "완료"] }, { name: "contentUrl", label: "콘텐츠 URL" }, { name: "memo", label: "메모", type: "textarea" }]} />
      </div>
    </>
  );
}
