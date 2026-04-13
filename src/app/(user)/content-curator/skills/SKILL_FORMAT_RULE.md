# Skill File Format Rule

## Cấu trúc bắt buộc

Mỗi skill file `.md` có thể có tối đa 4 heading sau (case-insensitive):

```
## IMAGE          ← tuỳ chọn — prompt phân tích ảnh
## TITLE          ← bắt buộc
## BULLET POINTS  ← bắt buộc
## DESCRIPTION    ← bắt buộc
```

Heading phải viết **chính xác**, không thêm số thứ tự, không thêm text phụ:

```markdown
✅ ## IMAGE
✅ ## TITLE
✅ ## BULLET POINTS
✅ ## DESCRIPTION

❌ ## II. TITLE
❌ ## TITLE — Công thức
❌ ## BULLETS
❌ ### TITLE
```

---

## Template chuẩn

```markdown
<!-- Phần preamble: viết brand rules, context chung — sẽ được gắn vào đầu TITLE + BULLET POINTS + DESCRIPTION -->
[Nội dung áp dụng cho toàn bộ listing: tone, giới hạn ký tự, quy tắc chung...]

## IMAGE
[Prompt hướng dẫn AI phân tích ảnh sản phẩm — KHÔNG gắn preamble, chạy độc lập]
[Nếu bỏ qua section này, hệ thống dùng prompt mặc định phân tích ảnh sticker]

## TITLE
[Rules, công thức, pattern, ví dụ — chỉ dùng khi generate TITLE]

## BULLET POINTS
[Rules, template từng bullet, ví dụ — chỉ dùng khi generate BULLETS]

## DESCRIPTION
[Rules, cấu trúc đoạn văn, ví dụ — chỉ dùng khi generate DESCRIPTION]
```

---

## Cơ chế hoạt động

```
File skill.md
     │
     ▼
splitSkill()
     │
     ├── preamble (trước ## IMAGE hoặc ## TITLE đầu tiên)
     │        └── gắn vào đầu TITLE + BULLET POINTS + DESCRIPTION
     │        └── KHÔNG gắn vào IMAGE (prompt ảnh chạy độc lập)
     │
     ├── skill_image.md       = nội dung sau ## IMAGE (không có preamble)
     ├── skill_title.md       = preamble + nội dung sau ## TITLE
     ├── skill_bullets.md     = preamble + nội dung sau ## BULLET POINTS
     └── skill_description.md = preamble + nội dung sau ## DESCRIPTION
```

Mỗi API call chỉ nhận đúng section liên quan:
- `generate-title` → chỉ thấy `skill_title`
- `generate-bullets` → chỉ thấy `skill_bullets`
- `generate-description` → chỉ thấy `skill_description`

---

## Kiểm tra sau khi import

Sau khi import file vào tool, kiểm tra indicator ở SkillConfig:

- ✅ **"Skill split: TITLE / BULLETS / DESCRIPTION ✓"** — split thành công
- ⚠️ **"Skill missing ## TITLE / ## BULLETS / ## DESCRIPTION sections"** — heading sai format

Nội dung thực tế sau split lưu tại:
```
skills/skill_local/skill_title.md
skills/skill_local/skill_bullets.md
skills/skill_local/skill_description.md
```

---

## Ví dụ file skill hoàn chỉnh

```markdown
Bạn là chuyên gia viết Amazon listing cho sản phẩm sticker vinyl.
Không dùng emoji. Không dùng ký tự đặc biệt (®©™).
Viết ngắn gọn, nhồi keyword tự nhiên.

## TITLE

Công thức: (XPcs) + [Keyword chính] + Sticker/Decal + Vinyl + Bề mặt + Kích thước

Quy tắc:
- Đặt keyword quan trọng nhất ở đầu
- Luôn có: Laptop, Water Bottle trong danh sách bề mặt
- Có kích thước ở cuối (vd: 3 Inches)
- Tối đa 200 ký tự

Ví dụ:
(3Pcs) Funny Cat Stickers Vinyl Decals for Laptop, Water Bottle, Phone - 3 Inches

## BULLETS

Template 5 bullets:
BP1 — Design/Theme: Mô tả design, keyword phụ chưa dùng ở title
BP2 — Quality: Waterproof, vinyl, durable, UV-resistant
BP3 — Surfaces: Bề mặt MỚI chưa có trong title
BP4 — Application: Die-cut, peel-and-stick, no residue
BP5 — Gift: Đối tượng + dịp + keyword còn lại

Quy tắc:
- Header IN HOA hoặc Title Case, kết thúc bằng : hoặc –
- 200-350 ký tự mỗi bullet
- Không lặp keyword đã có trong title

## DESCRIPTION

Cấu trúc 5 đoạn văn:
1. Hook + tổng quan SP
2. Chi tiết từng design (mô tả từ ảnh)
3. Chất lượng + kỹ thuật
4. Use case + bề mặt bổ sung
5. Gift/CTA + đối tượng còn lại

Quy tắc:
- Nhồi TẤT CẢ keyword chưa dùng ở title + bullets
- Viết paragraph, không dùng bullet points
- 800-1500 ký tự
```
