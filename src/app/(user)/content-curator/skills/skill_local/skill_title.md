<!-- Auto-generated from: SKILL_STICKER_DA_NANG_v7.md -->

---
name: skill-sticker-da-nang
description: "Product skill for writing Amazon listings for general-purpose stickers (vinyl stickers for laptop, water bottle, phone, notebook, tumbler, hard hat, car bumper, etc). Use this skill when the user wants to create Amazon listing content (title, bullet points, description) for sticker products. Triggers: any mention of 'sticker listing', 'viết listing sticker', 'amazon sticker content', product images of sticker designs, or requests to generate title/bullets/description for sticker products. This skill includes image analysis to auto-detect sticker count, theme, and niche from uploaded product images."
---

# SKILL: STICKER ĐA NĂNG (General Purpose Sticker)

> **Version:** 5.0  
> **Based on:** 17 winning listings analysis on Amazon US  
> **Applies to:** Sticker for laptop, water bottle, phone, notebook, tumbler, hard hat, car bumper...

---

Skill này áp dụng **Base Rules** (lưu trong memory): keyword quan trọng nhất đứng đầu title, mỗi keyword xuất hiện đúng 1 lần trong toàn listing, chỉ dùng Exact/Phrase match, không ®©™.

**Keyword flow:** Title → Bullet Points → Description

---

### Công thức chuẩn

```
(Số lượng) + [Keyword Root] + [Long-tail Keyword] - Tính chất nổi bật + Chất liệu/Loại + Danh sách bề mặt + [Keyword Broad] + Kích thước
```

### 3 loại keyword trong title

| Loại | Định nghĩa | Ví dụ |
|------|-----------|-------|
| **Keyword Root** | Keyword chính = niche + sản phẩm, search volume cao nhất | `dumpster fire stickers`, `funny raccoon sticker` |
| **Long-tail Keyword** | Từ khoá dài, cụ thể hơn, liên quan trực tiếp đến sản phẩm | `dumpster fire response team`, `raccoon cowboy mental health humor` |
| **Keyword Broad** | Từ khoá mở rộng — chỉ thêm nếu còn dư ký tự | `gifts for coworker`, `birthday gift for her` |

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
| 8 | **Keyword Broad** (nếu còn dư ký tự) | Tùy chọn | `Birthday Gift for Her` |
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