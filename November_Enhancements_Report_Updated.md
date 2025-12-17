# Unending Praise Website – November Enhancements Report
## Leadership Report (Non-Technical)

---

### 1. Executive Summary

During November 2025, the Unending Praise website underwent a significant upgrade to better support upcoming events and daily ministry activities.

The work focused on four main goals:

- **Stronger Foundations** – More secure admin access and reliable data storage
- **Better Content Tools** – Easier management of crusades, testimonies, songs, and media
- **Improved Visitor Experience** – Better layouts, mobile support, and stable livestream
- **Actionable Analytics** – New dashboard to help leadership understand visitors and page performance

Overall, the site is now **more stable**, **easier for staff to manage**, and **better equipped for large audiences**.

**[Image Placeholder: Homepage hero section showing livestream]**

---

### 2. High-Level Highlights

- **Secure Admin Login & Roles** – Ensures the right people have the right level of access
- **Crusade & Testimony Tools** – Now handle richer content, better media, and improved layouts
- **Livestream & Homepage** – Refined to look correct on phones and computers
- **Songs of the Day** – Now display clear, readable lyrics
- **New Analytics Dashboard** – Gives leadership visibility into traffic and top pages

---

### 3. Key Features – Before and After

#### 3.1 Admin Access & Security

**Before:**

- Admin access was simpler and less centralized
- It was harder to guarantee which accounts had which permissions

**After (November):**

- Admins now log in through a **secure database-backed system**, with clearly defined roles (superadmin, admin, crusade admin, testimony admin, songs admin)
- Certain tabs (like "Users" and some Analytics features) are **only visible to superadmins**
- The system automatically keeps designated superadmin accounts active and correctly configured, reducing the risk of lockouts

**[Image Placeholder: Admin login screen]**  
**[Image Placeholder: Admin dashboard with tabs and users list]**

---

#### 3.2 Crusades Management

**Before:**

- Crusades had fewer fields and simpler layouts
- Descriptions and media were more limited, and there was less structure around crusade "types"

**After (November):**

- Each crusade record now includes:
  - Title, date, **attendance**, **zone**, and **crusade type**
  - Detailed descriptions and summaries, including mandate and scripture text
  - Multiple images and videos, with the ability to **add, edit, or remove media**
- Crusade types can be created and edited, allowing events to be grouped and filtered
- The public crusades page has been redesigned for **clearer storytelling and better spacing**, including banners and improved mobile layouts
- **"View All Media" Gallery** – Visitors can click a "VIEW ALL →" button on crusade detail pages to see all images and videos in a beautiful gallery grid, then click any item to view it fullscreen

**[Image Placeholder: Crusade management form]**  
**[Image Placeholder: Public crusades page with cards and banners]**  
**[Image Placeholder: Crusade details page showing "VIEW ALL" button and media gallery]**

---

#### 3.3 Testimonies

**Before:**

- Testimony text sometimes **lost paragraph spacing**, making stories harder to read
- Some images and layouts were not centered properly, especially in carousels

**After (November):**

- Testimonies now **preserve original formatting**, including line breaks and paragraphs
- Images and videos are **centered and responsive**, giving testimonies a cleaner, more consistent look
- The testimonies carousel on the homepage was adjusted to:
  - Avoid cutting off text
  - Improve behavior on small screens
  - Provide smoother automatic sliding
- **"View All Media" Gallery** – On testimony detail pages, visitors can click a "VIEW ALL →" button to see all images and videos in a gallery grid. They can then click any item to view it fullscreen with navigation arrows to browse through all media

**[Image Placeholder: Testimony details page]**  
**[Image Placeholder: Testimonies carousel on homepage]**  
**[Image Placeholder: Testimony "VIEW ALL" gallery showing grid of images and videos]**

---

#### 3.4 Songs & Worship Content

**Before:**

- Songs and their lyrics could appear as dense text blocks
- Line breaks were not always honored, making verses and choruses harder to follow

**After (November):**

- Songs of the Day now display **properly formatted lyrics**, preserving line breaks
- Admins can **edit song titles and lyrics** more confidently, with the display matching the intended worship flow

**[Image Placeholder: Songs admin section or Songs of the Day view]**

---

#### 3.5 Livestream & Hero Section

**Before:**

- The hero section and livestream area went through different technical implementations
- On some devices and layouts, the livestream could appear **too small, too large, or partially hidden**

**After (November):**

- The livestream area has been **stabilized** using a simpler, reliable video embed
- Layouts were adjusted so the livestream:
  - Remains visible on both desktop and mobile
  - Holds a consistent height without awkward empty spaces
  - Integrates visually with the hero banner and other content
- **Picture-in-Picture Mode** – When the livestream is playing, visitors can use the **picture-in-picture button** in the video controls to keep watching in a small floating window while browsing other pages or tabs. This allows them to continue watching the livestream even when navigating away from the homepage
- **Sticky Livestream on Mobile** – On smaller screens (phones and tablets), when the livestream is playing, it **stays visible at the top of the screen** while scrolling down the page. This means visitors can continue watching while reading other content below

**[Image Placeholder: Homepage hero section showing livestream]**  
**[Image Placeholder: Livestream in picture-in-picture mode (small floating window)]**  
**[Image Placeholder: Mobile view showing sticky livestream while scrolling]**

---

#### 3.6 Visitor Experience & Layout

**Before:**

- Carousels (crusades, testimonies, images) sometimes:
  - Cut off text
  - Overlapped with other elements
  - Behaved inconsistently on smaller screens
- Navigation labels and some page text were not fully aligned with updated wording and mandate
- The Contact page design was less consistent and went through several iterations

**After (November):**

- Carousels now feature:
  - **Touch and swipe support** on mobile
  - Better heights and spacing to prevent text cutoff
  - Cleaner interactions when there is only a single card
- Navigation and various page texts were updated:
  - "Our Vision" renamed to **"About Us"**
  - Crusade, Testimony, and About copy refreshed to reflect **current mandate and messaging**
- The Contact page was adjusted to:
  - Keep the **message form** clearly visible
  - Integrate **KingsChat** contact information without clutter

**[Image Placeholder: Updated navigation and footer]**  
**[Image Placeholder: About or Contact page]**

---

#### 3.7 Media Handling & Performance

**Before:**

- Large, uncompressed images and videos could slow down page loads
- There were fewer safeguards to prevent overly large media uploads

**After (November):**

- Uploaded images are now **automatically compressed and resized**, helping pages load faster
- File size limits are in place for both images and videos, with user-friendly warnings
- Admins can now attach media by **uploading files or pasting URLs**, allowing re-use of existing online resources

**[Image Placeholder: Media upload area showing upload and URL options]**

---

#### 3.8 Live Chat & Comments

**Before:**

- No centralized real-time chat feature
- Limited ways for visitors to respond directly to content

**After (November):**

- A **live chat feature** has been added:
  - Messages appear instantly via WebSocket technology
  - Recent chat history (up to 100 messages) is stored and reloaded for continuity
- A **comments system** allows visitors to respond to content like testimonies or crusades:
  - Admins can moderate and remove comments when needed

**[Image Placeholder: Live chat panel]**  
**[Image Placeholder: Comment section under a content item]**

---

### 4. Analytics & Reporting (New Feature)

**Before:**

- There was no integrated way to see:
  - How many visitors the site had
  - Which pages were most popular
  - How traffic changed over time

**After (November):**

- A new **Analytics dashboard** has been added to the admin portal. It shows:
  - **Page views and unique visitors** for:
    - The last 7 days
    - The last 30 days
    - All time
  - **Current-year totals** and **monthly breakdowns**
  - A **daily chart** of page views for the last 7 days
  - A list of the **most visited pages**, with friendly page names
- Analytics can be:
  - **Printed** as a formatted report
  - **Exported to CSV**, for analysis in Excel or other tools

**[Image Placeholder: Analytics summary cards]**  
**[Image Placeholder: 7-day chart and top pages list]**

---

### 5. Impact for Leadership

The November work has:

- **Reduced operational risk** by securing admin access and stabilizing key systems like livestream and media storage
- **Empowered content teams** with better tools for managing crusades, testimonies, songs, and media assets
- **Improved visitor experience**, especially for mobile users and those joining via livestream
- **Equipped leadership with data**, via the new Analytics dashboard, to understand reach and make informed decisions

These changes position the Unending Praise website as a stronger digital platform for future events, testimonies, and daily ministry outreach.

---

## Screenshot Recommendations with Specific Captions

### Priority Screenshots (Must-Have):

1. **Homepage Hero & Livestream**  
   *Caption: "Homepage hero section with improved livestream area, optimized for both desktop and mobile visitors."*

2. **Livestream Picture-in-Picture Mode**  
   *Caption: "Picture-in-picture feature allows visitors to keep watching the livestream in a floating window while browsing other pages or tabs."*

3. **Mobile Sticky Livestream**  
   *Caption: "On mobile devices, the livestream stays visible at the top of the screen while scrolling, allowing visitors to watch while reading content below."*

4. **Admin Dashboard Tabs**  
   *Caption: "Admin dashboard with dedicated tabs for Testimonies, Crusades, Messages, Songs, Comments, and Analytics."*

5. **Crusade Management Form**  
   *Caption: "Crusade management form with attendance, zone, crusade type, detailed description, and media controls."*

6. **Testimony "View All Media" Gallery**  
   *Caption: "Testimony detail page showing the 'VIEW ALL' button and gallery grid displaying all images and videos for that testimony."*

7. **Analytics Dashboard Overview**  
   *Caption: "New Analytics dashboard summarizing visitors, page views, and most-visited pages for leadership insight."*

### Additional Screenshots (Nice-to-Have):

8. **Public Crusades Page**  
   *Caption: "Updated Crusades page showing enriched descriptions, banners, and improved layout on all devices."*

9. **Testimony Details Page**  
   *Caption: "Testimony details with preserved formatting, centered images, and clean storytelling layout."*

10. **Songs of the Day / Songs Admin**  
    *Caption: "Songs management with clear titles and properly formatted lyrics for worship segments."*

11. **Analytics Chart and Top Pages**  
    *Caption: "Daily page view chart and ranking of top pages, exportable to CSV or printable as a report."*

12. **Live Chat Panel**  
    *Caption: "Live chat feature enabling real-time engagement and stored conversation history."*

---

## How to Use This Document

1. **Copy the entire document** above (from "Unending Praise Website – November Enhancements Report" onwards)
2. **Paste into Microsoft Word**
3. **Replace each `[Image Placeholder: ...]` line** with the actual screenshot
4. **Add captions** using the recommended captions provided in the "Screenshot Recommendations" section
5. **Format as needed** (adjust fonts, spacing, add your company header/footer, etc.)

---

**Document Version:** Updated with Picture-in-Picture, Sticky Livestream, and View All Media features  
**Date:** December 2025  
**Prepared for:** Company Leadership





