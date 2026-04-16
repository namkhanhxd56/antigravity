---
name: skill-sticker-da-nang
description: "Product skill for writing Amazon listings for general-purpose stickers (vinyl stickers for laptop, water bottle, phone, notebook, tumbler, hard hat, car bumper, etc). Use this skill when the user wants to create Amazon listing content (title, bullet points, description, generic keywords) for sticker products. Triggers: any mention of 'sticker listing', 'viết listing sticker', 'amazon sticker content', product images of sticker designs, or requests to generate title/bullets/description for sticker products. This skill includes image analysis to auto-detect sticker count, theme, and niche from uploaded product images."
---

# SKILL: STICKER ĐA NĂNG (General Purpose Sticker)

> **Version:** 4.0  
> **Based on:** 17 winning listings analysis on Amazon US  
> **Applies to:** Sticker for laptop, water bottle, phone, notebook, tumbler, hard hat, car bumper...

---

## PHÂN LOẠI NICHE VÀ CÁCH ĐIỀU CHỈNH

### A. Funny/Sarcastic/Meme (59% listing win)
- **Title:** Thêm "Funny" + "Humor" + "Sarcastic" + "Meme"
- **BP1:** Emotional trigger = laugh, relatable, witty
- **Surfaces ưu tiên:** Hard Hat, Lunch Box, Toolbox
- **Gift angle:** Coworker, best friend, office party

### B. Awareness/Cause/Pride
- **Title:** Thêm "Awareness" + cause + "Decals for Car"
- **BP1:** Emotional trigger = empathy, safety, inclusion
- **Surfaces ưu tiên:** Car, Bumper, Truck, Window
- **Gift angle:** Parents, teachers, caregivers

### C. Inspirational/Motivational
- **Title:** Thêm "Inspirational" + "Quotes" + "Motivational"
- **BP1:** Emotional trigger = empowerment, affirmation
- **Surfaces ưu tiên:** Kindle, Journal, Planner, Mirror
- **Gift angle:** Women, teen girls, students

### D. Sport/Hobby
- **Title:** Thêm sport name + "Gift for Player/Team/Fan"
- **BP1:** Emotional trigger = team pride, passion
- **Surfaces ưu tiên:** Tumbler, Water Bottle, Car
- **Gift angle:** Teammate, coach, fan

### E. Aesthetic/Monogram
- **Title:** Thêm "Initial" + "Monogram" + "Floral" + "Aesthetic"
- **BP1:** Emotional trigger = personalization, elegance
- **Surfaces ưu tiên:** Journal, Water Bottle, Phone
- **Gift angle:** Women, teens, back-to-school

---

## IMAGE

Phân tích hình ảnh sản phẩm trước khi viết listing. Trích xuất các thông tin sau và trả về JSON.

### A. Đếm số lượng sticker
- Đếm số lượng sticker riêng biệt trong ảnh → dùng làm `(X Pcs)` trong title
- Nếu có nhiều ảnh, đếm tổng số design duy nhất (không đếm trùng)
- Nếu không rõ → để sticker_count = null

### B. Xác định chủ đề / theme
- Nhận diện nội dung chính: nhân vật, biểu tượng, text/quote, phong cách minh họa
- Xác định tone: funny/sarcastic, inspirational, awareness, sport, aesthetic
- Ghi nhận chi tiết thiết kế nổi bật: màu sắc chủ đạo, kiểu illustration, badge/emblem style

### C. Đọc text trên sticker
- Đọc và ghi lại chính xác mọi text/quote trên từng sticker
- Text này sẽ được sử dụng trong BP1 (Design/Theme) và Description

### D. Xác định niche tự động

| Dấu hiệu nhận diện | Niche |
|---------------------|-------|
| Meme, quote hài hước, nhân vật ngộ nghĩnh, dark humor | Funny/Sarcastic |
| Ribbon, message xã hội, rainbow, flag | Awareness/Cause |
| Quote truyền cảm hứng, hoa lá, butterfly, faith | Inspirational |
| Bóng, dụng cụ thể thao, logo team | Sport/Hobby |
| Chữ cái, hoa văn, monogram, minimalist | Aesthetic/Monogram |

### E. Bề mặt sử dụng
Xác định các bề mặt phù hợp dựa trên niche và thiết kế:
Laptop, Water Bottle, Phone/Phone Case, Tumbler, Car/Car Bumper, Hard Hat, Kindle, Journal, Notebook, Guitar, Skateboard, Helmet, Luggage

---

## TITLE

### A. Công thức Title chuẩn

```
(Số lượng từ ảnh) + [Keyword chính Exact/Phrase] + Tính chất nổi bật + Chất liệu/Loại + Danh sách bề mặt sử dụng + Kích thước
```

### B. Các thành phần Title theo thứ tự ưu tiên

| Vị trí | Thành phần | Tần suất | Ví dụ |
|--------|-----------|---------|-------|
| 1 | Số lượng `(XPcs)` — lấy từ ảnh | 76% | `(3Pcs)`, `(4 Pcs)` |
| 2 | Keyword chính (tên SP + niche) | 100% | `Funny Raccoon Sticker` |
| 3 | "Sticker/Stickers" | 100% | Luôn có |
| 4 | "Decal/Decals" | 82% | Đi kèm Vinyl |
| 5 | "Vinyl" | 70% | `Vinyl Decal` |
| 6 | Tính chất (Funny/Waterproof/Die-Cut) | 47-58% | Tùy niche |
| 7 | Danh sách bề mặt (phân cách bằng `,`) | 100% | `for Laptop, Water Bottle, Phone` |
| 8 | Kích thước | 76% | `3 Inches` |
| 9 | Gift/Đối tượng | 41% | `Gifts for Her, Him` |

### C. Bề mặt phổ biến trong Title

| Bề mặt | Tần suất | Ưu tiên |
|--------|---------|---------|
| Laptop | 100% | Luôn có |
| Water Bottle | 88% | Luôn có |
| Phone/Phone Case | 53% | Nên có |
| Tumbler | 41% | Nên có |
| Car/Car Bumper | 35% | Tùy niche |
| Hard Hat | 29% | Cho Funny/Blue collar |
| Kindle | 18% | Cho Inspirational |
| Journal | 18% | Cho Aesthetic |

### D. Dấu phân cách trong Title

- Dấu `,` : Liệt kê các đối tượng cùng nhóm (bề mặt, đối tượng)
- Dấu `-` hoặc `–` : Phân tách các cụm keyword không liên đới

### E. Ví dụ Title theo niche

**Funny/Sarcastic:**
```
(3Pcs) [Quote/Design] Stickers Funny Sarcastic Humor Waterproof Die-Cut Vinyl Decal for Laptop, Water Bottle, Phone, Hard Hat - Size 3x3 Inches
```

**Awareness/Cause:**
```
(4 Pcs) [Cause] Stickers - [Cause] Decals for Car, Bumper, Truck, Tumbler, Laptop - [Message] Stickers for [Audience] - [Size]
```

**Inspirational:**
```
(3Pcs) [Design] Sticker Inspirational Quotes Vinyl Decals for Tumbler, Laptop, Water Bottles, Phone - Size [AxB] Inches
```

**Sport/Hobby:**
```
(3PCS) [Sport] Stickers – Waterproof Vinyl Decals for Laptops, Water Bottles, Tumblers - [Sport] Gift for [Audience] [Size]
```

---

## BULLET POINTS

### A. Cấu trúc mỗi Bullet

```
[HEADER IN CAPS hoặc Title Case] + [: hoặc – hoặc -] + [Nội dung nhồi keyword chưa dùng]
```

**Quy tắc:**
- KHÔNG dùng emoji — Amazon không hỗ trợ ký tự đặc biệt
- Header: IN HOA hoặc Title Case, 2-5 từ
- Nội dung: nhồi keyword Exact/Phrase chưa dùng ở title, viết tự nhiên
- Nên viết trên 350 ký tự/bullet

### B. Template 5 Bullets

#### BP1 — Design/Theme Description
Giới thiệu SP, keyword phụ, điểm nổi bật thiết kế (dùng thông tin từ phân tích ảnh)

```
[Tên thiết kế] Stickers: [Mô tả design từ ảnh]. [Text/quote trên sticker]. Perfect for [đối tượng]. [Keyword phụ chưa dùng].
```

> VD: Dumpster Fire Response Team Sticker Pack: This hilarious 4-piece collection features bold badge and emblem designs including Response Team, Team Leader, and the iconic We Are All In This Together dumpster. Each piece showcases vibrant flames and crisp artwork with a sarcastic twist.

#### BP2 — Quality/Material
Keywords: waterproof, durable, vinyl, UV-resistant, fade-resistant, weatherproof, premium, scratchproof, laminate, outdoor-grade

```
[Premium Quality / Durable & Waterproof]: Made from [chất liệu] with [tính năng]. [Chi tiết kỹ thuật]. Perfect for indoor/outdoor use.
```

#### BP3 — Versatile Surfaces (KEYWORD STUFFING ZONE)
Bề mặt MỚI CHƯA có trong title: notebooks, journals, skateboards, guitars, motorcycles, helmets, luggage, lockers, planners, mirrors, toolboxes, lunch boxes, coolers, kindle, fridge, binders, desk

```
[Versatile for All Surfaces]: Ideal for decorating [danh sách bề mặt MỚI]. Works great on any smooth flat surface.
```

#### BP4 — Easy Application
Keywords: die-cut, peel-and-stick, adhesive backing, bubble-free, easy to apply/remove, no residue, repositionable

```
[Easy Peel and Stick]: These die-cut stickers feature peel-and-stick backing. [Hướng dẫn]. Removes easily with no residue.
```

#### BP5 — Gift/Occasion
Audiences: coworkers, friends, family, teachers, students, first responders, office workers, collectors
Occasions: birthdays, holidays, stocking stuffers, party favors, white elephant, back-to-school, retirement, appreciation

```
[Great Gift for All Occasions]: A thoughtful gift for [đối tượng]. Perfect for [dịp]. [Keyword còn lại].
```

---

## DESCRIPTION

### A. Quy tắc
- Nhồi TẤT CẢ keyword còn lại chưa dùng ở title + bullets
- Viết dạng đoạn văn (paragraph), KHÔNG bullet points
- Nên viết 800-1500 ký tự
- Sử dụng thông tin từ phân tích ảnh để mô tả chi tiết từng design

### B. Cấu trúc 5 đoạn

```
Đoạn 1: Hook + tổng quan SP (keyword biến thể chưa dùng)
Đoạn 2: Chi tiết từng design/sticker (mô tả từ ảnh + keyword niche)
Đoạn 3: Chất lượng + kỹ thuật (keyword chưa dùng ở BP2)
Đoạn 4: Use case + bề mặt bổ sung (bề mặt chưa nhắc ở title/BP3)
Đoạn 5: Gift/CTA + đối tượng/dịp còn lại
```

### C. Quy tắc keyword trong Description
- Mỗi keyword xuất hiện 1 LẦN DUY NHẤT trong toàn listing
- Exact/Phrase match, không Broad
- Tự nhiên trong câu văn, không liệt kê thô
