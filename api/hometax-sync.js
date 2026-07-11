// Vercel Serverless Function (Node.js runtime).
// 2차 확장 시: Popbill/Barobill/CODEF API 키는 여기(서버)에서만 process.env로 읽고,
// 프론트엔드 번들에는 절대 포함시키지 않는다. 지금은 자리만 잡아둔 스텁.
//
// 필요한 환경변수 예시 (Vercel Environment Variables에 등록):
//   POPBILL_LINK_ID, POPBILL_SECRET_KEY
//   BAROBILL_CERT_KEY
//   CODEF_CLIENT_ID, CODEF_CLIENT_SECRET

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "POST만 지원해요." });
  }

  const { provider } = req.body || {};

  // TODO(2차 확장): provider별로 분기해서 실제 API 호출 구현
  // if (provider === "popbill") { ... process.env.POPBILL_LINK_ID ... }

  return res.status(501).json({
    message: `${provider || "이"} 연동은 아직 준비 중이에요. CSV 업로드를 이용해주세요.`
  });
}
