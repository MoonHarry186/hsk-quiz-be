const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GEMINI_API_KEY } = require("../config/environment");

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const gradeEssay = async (promptQuestion, userAnswer, maxPoints = 10) => {
  if (!userAnswer || userAnswer.trim() === "") {
    return {
      isCorrect: false,
      pointsEarned: 0,
      feedback: "Bạn chưa nhập câu trả lời.",
    };
  }

  const prompt = `Bạn là một giáo viên chấm thi tiếng Trung HSK.
Đề bài: "${promptQuestion}"
Bài làm của học viên: "${userAnswer}"

Nhiệm vụ:
1. Chấm điểm bài làm. Điểm tối đa là ${maxPoints}.
2. Viết nhận xét chi tiết (khen ngợi, chỉ ra cụ thể lỗi sai).

QUY TẮC BẮT BUỘC:
- BẠN PHẢI VIẾT NHẬN XÉT 100% BẰNG TIẾNG VIỆT. TUYỆT ĐỐI KHÔNG DÙNG TIẾNG ANH.
- TRẢ VỀ ĐÚNG JSON, KHÔNG THÊM BẤT KỲ CHỮ NÀO BÊN NGOÀI.
Ví dụ chuẩn:
{
  "points": 10,
  "feedback": "Bài viết rất tốt, ngữ pháp chuẩn, không có lỗi sai."
}`;

  try {
    const result = await model.generateContent(prompt);
    let rawText = result.response.text().trim();

    // Gỡ bỏ markdown nếu có
    if (rawText.startsWith("```json")) {
      rawText = rawText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
    } else if (rawText.startsWith("```")) {
      rawText = rawText.replace(/```/g, "").trim();
    }

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI không trả về JSON hợp lệ.");

    const parsed = JSON.parse(jsonMatch[0]);

    // FIX CHÍNH LÀ ĐÂY: Thuật toán bóc tách số điểm siêu việt.
    // Cho dù AI trả về "10", "10/10", hay "10 điểm" thì cũng lấy được đúng số 10.
    let pointsEarned = 0;
    if (typeof parsed.points === "number") {
      pointsEarned = parsed.points;
    } else {
      const match = String(parsed.points).match(/[0-9.]+/);
      pointsEarned = match ? Number(match[0]) : 0;
    }

    if (isNaN(pointsEarned) || pointsEarned < 0) pointsEarned = 0;
    if (pointsEarned > maxPoints) pointsEarned = maxPoints;

    const isCorrect = pointsEarned >= maxPoints / 2;

    return {
      isCorrect: isCorrect,
      pointsEarned: pointsEarned,
      feedback: parsed.feedback || "Không có nhận xét chi tiết.",
    };
  } catch (err) {
    console.error("Lỗi AI chấm bài:", err);
    return {
      isCorrect: false,
      pointsEarned: 0,
      feedback: "Hệ thống AI chấm điểm đang bận. Vui lòng thử lại sau.",
    };
  }
};

module.exports = { gradeEssay };
