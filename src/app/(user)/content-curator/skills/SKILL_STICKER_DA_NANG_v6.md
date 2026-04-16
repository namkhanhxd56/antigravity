---
name: skill-sticker-da-nang
description: "Product skill for writing Amazon listings for general-purpose stickers (vinyl stickers for laptop, water bottle, phone, notebook, tumbler, hard hat, car bumper, etc). Use this skill when the user wants to create Amazon listing content (title, bullet points, description) for sticker products. Triggers: any mention of 'sticker listing', 'viết listing sticker', 'amazon sticker content', product images of sticker designs, or requests to generate title/bullets/description for sticker products. This skill includes image analysis to auto-detect sticker count, theme, and niche from uploaded product images."
---

# SKILL: STICKER ĐA NĂNG (General Purpose Sticker)

> **Version:** 6.0  
> **Based on:** 17 winning listings analysis on Amazon US  
> **Applies to:** Sticker for laptop, water bottle, phone, notebook, tumbler, hard hat, car bumper...

---

Skill này áp dụng **Base Rules** (lưu trong memory): keyword quan trọng nhất đứng đầu title, mỗi keyword xuất hiện đúng 1 lần trong toàn listing, chỉ dùng Exact/Phrase match, không ®©™.

**Keyword flow:** Title → Bullet Points → Description

---

## IMAGE

Khi người dùng upload hình ảnh sản phẩm, PHẢI phân tích trước khi viết listing.

### Các bước phân tích

**1. Đếm số lượng sticker**
- Đếm số design riêng biệt → dùng làm `(X Pcs)` trong title
- Nếu nhiều ảnh, đếm tổng design duy nhất (không đếm trùng)
- Nếu không rõ → để sticker_count = null

**2. Xác định chủ đề / theme**
- Nhận diện nội dung chính: nhân vật, biểu tượng, text/quote, phong cách minh họa
- Xác định tone: funny/sarcastic, inspirational, awareness, sport, aesthetic
- Ghi nhận chi tiết thiết kế nổi bật: màu sắc chủ đạo, kiểu illustration, badge/emblem style...

**3. Đọc text trên sticker**
- Đọc và ghi lại chính xác mọi text/quote trên từng sticker
- Text này sẽ dùng trong BP1 và Description

**4. Xác định niche**

| Dấu hiệu nhận diện | Niche |
|---------------------|-------|
| Meme, quote hài hước, nhân vật ngộ nghĩnh, dark humor | Funny/Sarcastic |
| Ribbon, message xã hội, rainbow, flag | Awareness/Cause |
| Quote truyền cảm hứng, hoa lá, butterfly, faith | Inspirational |
| Bóng, dụng cụ thể thao, logo team | Sport/Hobby |
| Chữ cái, hoa văn, monogram, minimalist | Aesthetic/Monogram |

### Output sau phân tích

Trình bày kết quả trước khi viết listing:
```
📦 Số lượng: X Pcs
🎨 Chủ đề: [mô tả ngắn]
🏷️ Niche: [Funny/Awareness/Inspirational/Sport/Aesthetic]
📝 Text trên sticker: ["quote 1", "quote 2", ...]
🎯 Chi tiết thiết kế: [mô tả style, màu sắc, kiểu illustration]
```

---

## TITLE

**Giới hạn:** tối đa 200 ký tự

### Công thức chuẩn

```
(Số lượng) + [Keyword Root] + [Long-tail Keyword] - Tính chất nổi bật + Chất liệu/Loại + Danh sách bề mặt + [Keyword Broad] + Kích thước
```

### 3 loại keyword trong title

| Loại | Định nghĩa | Ví dụ |
|------|-----------|-------|
| **Keyword Root** | Keyword chính = niche + sản phẩm, search volume cao nhất | `dumpster fire stickers`, `funny raccoon sticker` |
| **Long-tail Keyword** | Từ khoá dài, cụ thể hơn, liên quan trực tiếp đến sản phẩm | `dumpster fire response team`, `raccoon cowboy mental health humor` |
| **Keyword Broad** | Từ khoá mở rộng theo niche — chỉ thêm nếu còn dư ký tự | Funny Stickers, Sarcastic Stickers, Inspirational Stickers, Sport Sticker... |

### Các thành phần theo thứ tự ưu tiên

| Vị trí | Thành phần | Tần suất | Ví dụ |
|--------|-----------|---------|-------|
| 1 | Số lượng `(XPcs)` — lấy từ ảnh | 76% | `(3Pcs)`, `(4 Pcs)` |
| 2 | **Keyword Root** (niche + sản phẩm) | 100% | `Dumpster Fire Stickers` |
| 3 | **Long-tail Keyword** | Nên có | `Dumpster Fire Response Team` |
| 4 | Dấu `-` hoặc `–` phân tách | — | — |
| 5 | Tính chất (Funny/Waterproof/Die-Cut) | 47–58% | Tùy niche |
| 6 | Chất liệu "Vinyl Decal" | 70–82% | `Vinyl Decal` |
| 7 | Danh sách bề mặt (phân cách bằng `,`) | 100% | `for Laptop, Water Bottle, Phone` |
| 8 | **Keyword Broad** (nếu còn dư ký tự) | Tùy chọn | `Funny Stickers`, `Inspirational Stickers` |
| 9 | Kích thước | 76% | `3 Inches` |

### Bề mặt phổ biến trong Title

| Bề mặt | Tần suất | Ghi chú |
|--------|---------|---------|
| Laptop | 100% | Luôn có |
| Water Bottle | 88% | Luôn có |
| Phone/Phone Case | 53% | Nên có |
| Tumbler | 41% | Nên có |
| Car/Car Bumper | 35% | Tùy niche |
| Hard Hat | 29% | Cho Funny/Blue collar |
| Kindle | 18% | Cho Inspirational |
| Journal | 18% | Cho Aesthetic |

### Ví dụ Title theo niche

**Funny/Sarcastic:**
```
(4 Pcs) Dumpster Fire Stickers - Dumpster Fire Response Team Leader Funny Sarcastic Humor Waterproof Vinyl Decal for Laptop, Water Bottle, Phone, Hard Hat - 3 Inches
```

**Awareness/Cause:**
```
(4 Pcs) Autism Car Decals - Autism Awareness Car Sticker Decals for Car, Bumper, Truck, Tumbler, Laptop - Autistic Child On Board Stickers - 4 Inch
```

**Inspirational:**
```
(3Pcs) Faith Christian Sticker - Inspirational Quotes Bible Verse Jesus Floral Butterfly Vinyl Decals for Tumbler, Laptop, Water Bottles, Phone - Gifts for Women - 3x2.5 Inches
```

**Sport/Hobby:**
```
(3PCS) Softball Heart Sticker – Softball Stickers for Teams and Players Waterproof Vinyl Decals for Laptops, Water Bottles, Tumblers - 3 x 3 Inches
```

---

## BULLET POINTS

### Quy tắc chung
- KHÔNG dùng emoji — Amazon không hỗ trợ ký tự đặc biệt
- Header: IN HOA hoặc Title Case, 2–5 từ
- Nội dung: nhồi keyword Exact/Phrase chưa dùng ở title, viết tự nhiên
- Nên viết 350–450 ký tự/bullet

### Template 5 Bullets

#### BP1 — Design/Theme Description
Giới thiệu SP và điểm nổi bật thiết kế — dùng thông tin từ phân tích ảnh (chủ đề, text trên sticker, style minh họa). **Nhồi tối thiểu 3 keywords available chưa dùng ở title.**

```
[Tên thiết kế] Stickers: [Mô tả design từ ảnh]. [Text/quote trên sticker]. Perfect for [đối tượng]. [≥3 keyword chưa dùng].
```

#### BP2 — Target Audience
Mô tả đối tượng sử dụng phù hợp với sản phẩm. **Nhồi tối thiểu 2 keywords available chưa dùng.**

```
[Perfect for / Ideal for / Made for]: [Mô tả đối tượng sử dụng]. [Dịp/tình huống phù hợp]. [≥2 keyword chưa dùng].
```

Audiences theo niche:
- Funny/Sarcastic: office workers, coworkers, nurses, teachers, first responders, blue collar workers
- Awareness/Cause: parents, caregivers, teachers, advocates, supporters
- Inspirational: women, teen girls, students, Christian community, self-care enthusiasts
- Sport/Hobby: players, coaches, fans, team members, sport enthusiasts
- Aesthetic/Monogram: teens, college students, women, journal lovers

#### BP3 — Versatile Surfaces + Quality/Material *(KEYWORD STUFFING ZONE)*
Kết hợp 2 nội dung: (1) bề mặt **mới chưa có trong title**, (2) đặc tính chất liệu/chất lượng.

Bề mặt mới: notebooks, journals, skateboards, guitars, motorcycles, helmets, luggage, lockers, planners, mirrors, toolboxes, lunch boxes, coolers, kindle, fridge, binders, desk  
Quality keywords: waterproof, durable, vinyl, UV-resistant, fade-resistant, weatherproof, premium, scratchproof, laminate, outdoor-grade

```
[Versatile & Durable]: Stick them on [danh sách bề mặt mới]. Made from [chất liệu] with [tính năng: waterproof, UV-resistant, fade-resistant...]. Works great on any smooth flat surface, indoors or outdoors.
```

#### BP4 — Easy Application
Keywords: die-cut, peel-and-stick, adhesive backing, bubble-free, easy to apply/remove, no residue, repositionable

```
[Easy Peel and Stick]: These die-cut stickers feature peel-and-stick backing. [Hướng dẫn ngắn]. Removes easily with no residue.
```

#### BP5 — Gift/Occasion
Audiences: coworkers, friends, family, teachers, students, first responders, office workers, collectors  
Occasions: birthdays, holidays, stocking stuffers, party favors, white elephant, back-to-school, retirement, appreciation

```
[Great Gift for All Occasions]: A thoughtful gift for [đối tượng]. Perfect for [dịp]. [Keyword còn lại].
```

### Điều chỉnh theo niche

| Niche | Keyword ưu tiên ở BP1 | Đối tượng ở BP2 | Bề mặt ưu tiên ở BP3 | Gift angle ở BP5 |
|-------|----------------------|----------------|----------------------|-----------------|
| Funny/Sarcastic | funny, humor, sarcastic, meme, dark humor | Office workers, coworkers, nurses, first responders | Hard Hat, Lunch Box, Toolbox | Coworker, best friend, office party |
| Awareness/Cause | awareness, support, pride, inclusion | Parents, caregivers, teachers, advocates | Car, Bumper, Truck, Window | Parents, teachers, caregivers |
| Inspirational | inspirational, motivational, quotes, faith | Women, teen girls, students, Christian community | Kindle, Journal, Planner, Mirror | Women, teen girls, students |
| Sport/Hobby | [sport name], team, player, fan, coach | Players, coaches, fans, team members | Tumbler, Water Bottle, Car | Teammate, coach, fan |
| Aesthetic/Monogram | initial, monogram, floral, aesthetic | Teens, college students, journal lovers | Journal, Water Bottle, Phone | Women, teens, back-to-school |

---

## DESCRIPTION

### Quy tắc
- Nhồi keyword còn lại chưa dùng ở title + bullets
- Viết dạng đoạn văn (paragraph), KHÔNG dùng bullet points
- Viết đơn giản, dễ đọc — độ dài khuyến nghị: 500–1000 ký tự
- Dùng thông tin phân tích ảnh để mô tả sản phẩm

### Cấu trúc gợi ý (có thể lược bỏ đoạn nếu không cần thiết)

```
Đoạn 1: Hook + tổng quan SP (keyword biến thể chưa dùng)
Đoạn 2: Chi tiết design/sticker (mô tả từ ảnh + keyword niche)
Đoạn 3: Chất lượng + ứng dụng (keyword chưa dùng)
Đoạn 4: Gift/CTA + đối tượng/dịp còn lại
Đoạn 5: (tuỳ chọn) Bề mặt bổ sung hoặc thông tin thêm
```
