export interface MediaItem {
  type: "image" | "video";
  url: string;
}

export interface Comment {
  id: number;
  name: string;
  comment: string;
}

export interface Testimony {
  id: number;
  title: string;
  author: string;
  summary: string;
  image: string;
  description: string;
  media: MediaItem[];
  comments: Comment[];
}

export interface Crusade {
  id: number;
  title: string;
  location: string;
  date: string;
  image: string;
  subtitle: string;
  description: string;
  media: MediaItem[];
  comments: Comment[];
  type?: "prison" | "online";
}

// Using Unsplash for realistic images
const getImageUrl = (id: string, width = 800, height = 600) => 
  `https://images.unsplash.com/photo-${id}?w=${width}&h=${height}&fit=crop&auto=format`;

const getVideoUrl = () => 
  "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4";

export const testimoniesData: Testimony[] = [
  {
    id: 1,
    title: "My Journey from Addiction to Freedom",
    author: "Michael Thompson",
    summary: "After battling addiction for over a decade, I found hope and healing through faith. Today I'm completely free and helping others find the same transformation.",
    image: getImageUrl("1548554448-087ebf1e11e3", 600, 400),
    description: "For years, I was trapped in the cycle of addiction. My life was spiraling out of control - lost jobs, broken relationships, and constant despair. When I thought there was no way out, I attended a service and heard a message about God's redeeming love. That day, I made a decision that changed everything. Through prayer, support, and unwavering faith, I broke free from the chains that held me captive. Today, I'm three years sober, have restored my family, and dedicated my life to helping others find freedom. God's grace is truly sufficient, and His power is made perfect in our weakness.",
    media: [
      { type: "image", url: getImageUrl("1548554448-087ebf1e11e3") },
      { type: "image", url: getImageUrl("1548554448-f91b79b4d8c8") },
      { type: "video", url: getVideoUrl() },
      { type: "image", url: getImageUrl("1497435332909-251e61e4e502") },
    ],
    comments: [
      { id: 1, name: "James Parker", comment: "Your story gives me hope. Thank you for sharing!" },
      { id: 2, name: "Sarah Mitchell", comment: "God is truly a God of miracles. Stay blessed!" },
      { id: 3, name: "David Brown", comment: "Inspiring testimony! Keep the faith!" },
    ],
  },
  {
    id: 2,
    title: "Healing Beyond Medical Explanation",
    author: "Grace Williams",
    summary: "Doctors gave me three months to live after my cancer diagnosis. Through prayer and faith, I witnessed a complete healing that defied all medical odds.",
    image: getImageUrl("1511795409834-ef04bbd61622", 600, 400),
    description: "The news came like a thunderbolt - stage 4 cancer, three months to live, no cure possible. My world crumbled in that moment. But instead of giving up, I chose to trust God. My church family surrounded me with prayer, my faith community lifted me up daily, and I held onto God's promises. Week after week, I prayed and believed. When I went back for my next scan, the doctors couldn't explain it - the tumors were gone. Completely vanished. They ran test after test, but the results were clear: I was cancer-free. It's been five years now, and I'm still in perfect health. This wasn't a coincidence; this was a miracle.",
    media: [
      { type: "image", url: getImageUrl("1511795409834-ef04bbd61622") },
      { type: "image", url: getImageUrl("1548554448-087ebf1e11e3") },
      { type: "video", url: getVideoUrl() },
      { type: "image", url: getImageUrl("1505373877841-8d25f7d46678") },
    ],
    comments: [
      { id: 1, name: "Jennifer Adams", comment: "What an amazing testimony! God is still in the healing business!" },
      { id: 2, name: "Robert Taylor", comment: "Your faith is inspiring. Thank you for sharing this miracle!" },
    ],
  },
  {
    id: 3,
    title: "From Financial Ruin to Miraculous Provision",
    author: "Robert Chen",
    summary: "Lost everything in a business deal that went wrong. Through prayer and faith, I saw God's provision in ways I never imagined possible.",
    image: getImageUrl("1505373877841-8d25f7d46678", 600, 400),
    description: "Two years ago, I hit rock bottom. A business partnership collapsed, leaving me with massive debt and forced to declare bankruptcy. I lost my home, my car, and couldn't provide for my family. In that darkest moment, I turned to God. Every morning, I prayed for provision. I applied for hundreds of jobs with no success. Just when I thought all hope was lost, out of nowhere, I received an unexpected inheritance from a distant relative I barely knew - enough to clear all my debts. But more than that, an opportunity came for a position perfectly suited to my skills. Today, I'm not just surviving; I'm thriving, and my testimony is that when God closes one door, He opens another far better.",
    media: [
      { type: "image", url: getImageUrl("1505373877841-8d25f7d46678") },
      { type: "image", url: getImageUrl("1548554448-f91b79b4d8c8") },
      { type: "video", url: getVideoUrl() },
    ],
    comments: [
      { id: 1, name: "Elizabeth Foster", comment: "Your testimony gives me hope in my situation. Thank you!" },
      { id: 2, name: "Marcus Johnson", comment: "God truly provides! Inspiring story!" },
    ],
  },
  {
    id: 4,
    title: "Deliverance from Depression and Suicidal Thoughts",
    author: "Emma Rodriguez",
    summary: "Struggled with severe depression for years, even reaching the point of planning suicide. God's love pulled me out of the darkest pit.",
    image: getImageUrl("1568808163202-efd7e7d63d77", 600, 400),
    description: "For five years, I lived under a cloud of darkness. Depression had taken hold of my life so completely that I couldn't see light anymore. I had a successful career, a loving family, but inside I was empty. I reached the point where I was making plans to end my life. The night I had decided would be my last, I attended a service almost against my will. During the altar call, something broke inside me. I felt a warmth and peace I'd never experienced. Tears streamed down my face as I surrendered completely. That was the turning point. Through counseling, prayer, and God's word, I found healing. Today, I help others walk through depression, knowing there's always hope in Christ.",
    media: [
      { type: "image", url: getImageUrl("1568808163202-efd7e7d63d77") },
      { type: "image", url: getImageUrl("1505373877841-8d25f7d46678") },
      { type: "video", url: getVideoUrl() },
      { type: "image", url: getImageUrl("1548554448-087ebf1e11e3") },
    ],
    comments: [
      { id: 1, name: "Sophia Martinez", comment: "This is exactly what I needed to hear. Thank you for sharing!" },
      { id: 2, name: "Daniel Lee", comment: "Your courage to share this will help many. God bless!" },
    ],
  },
  {
    id: 5,
    title: "Restored Marriage After Near Divorce",
    author: "Thomas and Maria Anderson",
    summary: "Our marriage was hanging by a thread after years of hurt and bitterness. God's intervention brought reconciliation and renewed love.",
    image: getImageUrl("1507003211169-0a1dd7228f2d", 600, 400),
    description: "After 12 years of marriage, we were ready to call it quits. Years of unresolved conflicts, hurt feelings, and growing apart had left us estranged. We barely communicated, and when we did, it was only fights. I had filed for divorce papers. Then a friend invited us to a marriage seminar at church. We went reluctantly. During that weekend, we learned about forgiveness, love languages, and truly putting God at the center of our marriage. We made a commitment to fight for our marriage instead of fighting with each other. It wasn't overnight, but slowly we began to heal. We learned to communicate with love and respect. Today, our marriage is stronger than it ever was - full of love, mutual respect, and joy. God can truly restore what seems beyond repair.",
    media: [
      { type: "image", url: getImageUrl("1507003211169-0a1dd7228f2d") },
      { type: "image", url: getImageUrl("1568808163202-efd7e7d63d77") },
      { type: "video", url: getVideoUrl() },
    ],
    comments: [
      { id: 1, name: "Kevin and Lisa Moore", comment: "This gives us hope for our marriage. Thank you!" },
      { id: 2, name: "Richard Clark", comment: "Beautiful testimony of God's restorative power!" },
    ],
  },
  {
    id: 6,
    title: "Finding My Identity After a Life of Confusion",
    author: "Jordan Taylor",
    summary: "Spent years struggling with identity, feeling lost and purposeless. Discovered who I truly am in Christ and found my calling.",
    image: getImageUrl("1548554448-f91b79b4d8c8", 600, 400),
    description: "Growing up, I never felt like I fit in anywhere. I tried everything to find my identity - different careers, relationships, even lived abroad for a while searching for purpose. Nothing filled the void. I felt like an actor playing a role, never being my authentic self. When I came to faith, something shifted. I learned that my identity wasn't in what I did or who others said I was, but in who God created me to be. Through prayer and discovering my spiritual gifts, I found clarity. I realized I was called to ministry. Today, I pastor a growing church, helping others discover their identity in Christ. Finding who you are in God changes everything.",
    media: [
      { type: "image", url: getImageUrl("1548554448-f91b79b4d8c8") },
      { type: "image", url: getImageUrl("1511795409834-ef04bbd61622") },
      { type: "image", url: getImageUrl("1505373877841-8d25f7d46678") },
      { type: "video", url: getVideoUrl() },
    ],
    comments: [
      { id: 1, name: "Alex Rivera", comment: "This speaks to me on so many levels. Thank you!" },
      { id: 2, name: "Casey Wilson", comment: "Identity in Christ is everything. Powerful story!" },
    ],
  },
  {
    id: 7,
    title: "A Mother's Prayer for Her Prodigal Son",
    author: "Patricia Johnson",
    summary: "My son walked away from faith and into dangerous lifestyle for years. I never stopped praying. God brought him home.",
    image: getImageUrl("1497435332909-251e61e4e502", 600, 400),
    description: "When my son turned 18, he walked away from everything we had taught him. He left home, stopped coming to church, and got involved with drugs and bad company. For ten years, I barely heard from him except when he needed money. My heart broke continuously, but I never stopped praying. Every single day, I prayed for God's protection over him and for him to come home - to his family and to faith. Last year, he called me in the middle of the night, crying. He'd hit rock bottom and realized he needed God. Today, he's back home, working, clean, and leading youth ministry at our church. A mother's prayer is powerful, and God never abandons our prodigals.",
    media: [
      { type: "image", url: getImageUrl("1497435332909-251e61e4e502") },
      { type: "video", url: getVideoUrl() },
      { type: "image", url: getImageUrl("1568808163202-efd7e7d63d77") },
    ],
    comments: [
      { id: 1, name: "Linda Thompson", comment: "I'm praying for my daughter. Your story gives me strength!" },
      { id: 2, name: "Margaret Davis", comment: "Never give up on praying for your children. Beautiful!" },
    ],
  },
  {
    id: 8,
    title: "Overcoming Infertility: Our Miracle Baby",
    author: "David and Sarah Kim",
    summary: "Faced six years of infertility with multiple miscarriages. Against all medical odds, God blessed us with a beautiful baby girl.",
    image: getImageUrl("1511795409834-ef04bbd61622", 600, 400),
    description: "For six years, we tried to have a baby. We went through countless fertility treatments, procedures, and faced the devastating loss of three miscarriages. Doctors told us our chances of conceiving were less than 2%. We were exhausted emotionally, financially, and spiritually. People at church kept praying with us, believing God for a miracle. When we had almost given up hope, my wife discovered she was pregnant again. We held our breath for nine months, praying daily. When we held our daughter for the first time, I knew beyond any doubt that this was God's miracle. She's now three years old, healthy and beautiful, a constant reminder that nothing is impossible with God.",
    media: [
      { type: "image", url: getImageUrl("1511795409834-ef04bbd61622") },
      { type: "image", url: getImageUrl("1548554448-087ebf1e11e3") },
      { type: "video", url: getVideoUrl() },
      { type: "image", url: getImageUrl("1505373877841-8d25f7d46678") },
    ],
    comments: [
      { id: 1, name: "Rachel and James Park", comment: "We're going through this now. Your story gives us hope!" },
      { id: 2, name: "Michelle Chen", comment: "Miracles still happen! Congratulations!" },
    ],
  },
  {
    id: 9,
    title: "From Prison to Promise: God's Redemption Story",
    author: "Anthony Williams",
    summary: "Spent five years in prison for crimes I committed. Met Christ behind bars and now I'm helping others find the same redemption.",
    image: getImageUrl("1548554448-087ebf1e11e3", 600, 400),
    description: "I was 22 when I went to prison. I had made terrible choices, hurt people, broke the law, and lost everything including my freedom. In prison, I felt hopeless and worthless. Then a prison chaplain introduced me to Jesus. I began reading the Bible and praying. Something changed in me. I realized that even though I deserved punishment, God offered grace. I got paroled after five years. Now, three years later, I have a job, a wife, a church family, and I volunteer ministering to other inmates. I tell them what God did for me. My past doesn't define me anymore - my identity is in Christ. God took someone broken and made me whole.",
    media: [
      { type: "image", url: getImageUrl("1548554448-087ebf1e11e3") },
      { type: "image", url: getImageUrl("1507003211169-0a1dd7228f2d") },
      { type: "video", url: getVideoUrl() },
    ],
    comments: [
      { id: 1, name: "Christopher Green", comment: "Powerful testimony of God's redeeming love!" },
      { id: 2, name: "Amanda White", comment: "God transforms lives! Thank you for sharing!" },
    ],
  },
  {
    id: 10,
    title: "The Day I Met Jesus: My Conversion Story",
    author: "Lisa Martinez",
    summary: "Grew up in church but never knew Jesus personally. At 28, I had a real encounter that completely transformed my life.",
    image: getImageUrl("1568808163202-efd7e7d63d77", 600, 400),
    description: "I grew up going to church every Sunday, knew all the Bible stories, sang the hymns, but it was all just religion to me. I didn't really know Jesus. By 28, I was successful, had everything society said would make me happy, but felt empty inside. One Sunday, the pastor's message hit differently. For the first time, I understood that Jesus wanted a relationship with me, not just my attendance. I went to the altar, tears streaming down my face, and gave my life to Christ. Everything changed - my priorities, my relationships, my perspective. I found purpose and joy I never knew existed. I went from religion to relationship, and that made all the difference.",
    media: [
      { type: "image", url: getImageUrl("1568808163202-efd7e7d63d77") },
      { type: "image", url: getImageUrl("1548554448-f91b79b4d8c8") },
      { type: "image", url: getImageUrl("1497435332909-251e61e4e502") },
      { type: "video", url: getVideoUrl() },
    ],
    comments: [
      { id: 1, name: "Nicole Garcia", comment: "This resonates with me. Thank you for your honesty!" },
      { id: 2, name: "Benjamin Rodriguez", comment: "Relationship over religion - beautifully put!" },
    ],
  },
];

export const crusadesData: Crusade[] = [
  {
    id: 1,
    title: "A DAY OF BLESSINGS",
    location: "LAGOS STATE",
    date: "Dec 2023",
    image: getImageUrl("1497435332909-251e61e4e502", 680, 400),
    subtitle: "Lekki Prison Lagos State",
    description: "A powerful prison crusade in Lagos that touched hundreds of inmates. The Word of God brought hope and transformation to many behind bars. Lives were changed, and inmates found new purpose in Christ. It was a day of blessing and breakthrough for those who needed it most.",
    type: "prison",
    media: [
      { type: "image", url: getImageUrl("1497435332909-251e61e4e502") },
      { type: "image", url: getImageUrl("1548554448-087ebf1e11e3") },
      { type: "video", url: getVideoUrl() },
      { type: "image", url: getImageUrl("1511795409834-ef04bbd61622") },
      { type: "image", url: getImageUrl("1548554448-f91b79b4d8c8") },
    ],
    comments: [
      { id: 1, name: "Officer Adebayo", comment: "This ministry has transformed the prison atmosphere. Thank you!" },
      { id: 2, name: "Emeka Okafor", comment: "I found hope and salvation. God is good!" },
    ],
  },
  {
    id: 2,
    title: "A DAY OF BLESSINGS",
    location: "ENUGU STATE",
    date: "Nov 2023",
    image: getImageUrl("1548554448-087ebf1e11e3", 680, 400),
    subtitle: "Maximum Security Prison, Enugu",
    description: "Enugu witnessed a mighty move of God during this prison outreach. Despite the challenges, God's Word penetrated hearts. Inmates received ministry and many gave their lives to Christ. The testimonies were powerful and encouraging.",
    type: "prison",
    media: [
      { type: "image", url: getImageUrl("1548554448-087ebf1e11e3") },
      { type: "image", url: getImageUrl("1497435332909-251e61e4e502") },
      { type: "image", url: getImageUrl("1505373877841-8d25f7d46678") },
      { type: "video", url: getVideoUrl() },
    ],
    comments: [
      { id: 1, name: "Chima Okafor", comment: "This changed my life. I'm now free in Christ!" },
      { id: 2, name: "Ngozi Onyeka", comment: "Hope was restored to me. God bless you!" },
    ],
  },
  {
    id: 3,
    title: "A DAY OF BLESSINGS",
    location: "ABUJA FCT",
    date: "Oct 2023",
    image: getImageUrl("1511795409834-ef04bbd61622", 680, 400),
    subtitle: "Kuje Prison, Abuja",
    description: "Abuja FCT hosted this remarkable prison ministry. The presence of God was palpable as we ministered. Inmates experienced genuine transformation and many committed to living for Christ. The Holy Spirit worked mightily throughout the gathering.",
    type: "prison",
    media: [
      { type: "image", url: getImageUrl("1511795409834-ef04bbd61622") },
      { type: "video", url: getVideoUrl() },
      { type: "image", url: getImageUrl("1548554448-f91b79b4d8c8") },
      { type: "image", url: getImageUrl("1568808163202-efd7e7d63d77") },
    ],
    comments: [
      { id: 1, name: "Ibrahim Musa", comment: "I received salvation that day. Thank you for not giving up on us!" },
    ],
  },
  {
    id: 4,
    title: "A DAY OF BLESSINGS",
    location: "ONLINE",
    date: "Mar 2024",
    image: getImageUrl("1505373877841-8d25f7d46678", 680, 400),
    subtitle: "Global Online Stream",
    description: "Our first major online crusade reached thousands across the globe. People tuned in from various time zones to experience God's presence. The digital platform became a sanctuary of worship and prayer. Testimonies poured in from viewers who experienced God's touch from their homes.",
    type: "online",
    media: [
      { type: "image", url: getImageUrl("1505373877841-8d25f7d46678") },
      { type: "image", url: getImageUrl("1497435332909-251e61e4e502") },
      { type: "video", url: getVideoUrl() },
      { type: "image", url: getImageUrl("1548554448-087ebf1e11e3") },
      { type: "image", url: getImageUrl("1511795409834-ef04bbd61622") },
    ],
    comments: [
      { id: 1, name: "Sarah Johnson", comment: "I watched from London. God touched me! Amazing!" },
      { id: 2, name: "Michael Chen", comment: "From Canada - this stream blessed my entire family!" },
    ],
  },
  {
    id: 5,
    title: "A DAY OF BLESSINGS",
    location: "ONLINE",
    date: "Apr 2024",
    image: getImageUrl("1568808163202-efd7e7d63d77", 680, 400),
    subtitle: "Easter Global Service",
    description: "Celebrating the resurrection power of Christ through our online platform. This special Easter service brought together believers worldwide. The preaching emphasized Christ's victory over death and the power available to believers. Lives were impacted across continents.",
    type: "online",
    media: [
      { type: "image", url: getImageUrl("1568808163202-efd7e7d63d77") },
      { type: "image", url: getImageUrl("1505373877841-8d25f7d46678") },
      { type: "image", url: getImageUrl("1548554448-f91b79b4d8c8") },
      { type: "video", url: getVideoUrl() },
    ],
    comments: [
      { id: 1, name: "David Lopez", comment: "Powerful Easter message from Mexico!" },
      { id: 2, name: "Emma Williams", comment: "The resurrection power is real. Bless you!" },
    ],
  },
  {
    id: 6,
    title: "A DAY OF BLESSINGS",
    location: "ONLINE",
    date: "May 2024",
    image: getImageUrl("1507003211169-0a1dd7228f2d", 680, 400),
    subtitle: "Pentecost Power Conference",
    description: "Pentecost Power Conference brought the fire online. Focusing on the baptism of the Holy Spirit, this event ignited revival in many hearts. Viewers from around the world were filled with the Spirit and activated in their gifts. Prophetic ministry flowed as God released His people.",
    type: "online",
    media: [
      { type: "image", url: getImageUrl("1507003211169-0a1dd7228f2d") },
      { type: "video", url: getVideoUrl() },
      { type: "image", url: getImageUrl("1568808163202-efd7e7d63d77") },
      { type: "image", url: getImageUrl("1505373877841-8d25f7d46678") },
      { type: "image", url: getImageUrl("1497435332909-251e61e4e502") },
    ],
    comments: [
      { id: 1, name: "Rachel Kim", comment: "I received the Holy Spirit baptism! Fire fell!" },
      { id: 2, name: "Thomas Anderson", comment: "From Australia - this was life-changing!" },
    ],
  },
  {
    id: 7,
    title: "A DAY OF BLESSINGS",
    location: "KADUNA STATE",
    date: "Sep 2023",
    image: getImageUrl("1548554448-f91b79b4d8c8", 680, 400),
    subtitle: "Kaduna Central Prison",
    description: "Kaduna saw a mighty move of God's Spirit in this prison outreach. The preaching of the Word brought conviction and hope. Many inmates surrendered their lives to Christ and began their journey of transformation. It was a day of divine encounters.",
    type: "prison",
    media: [
      { type: "image", url: getImageUrl("1548554448-f91b79b4d8c8") },
      { type: "image", url: getImageUrl("1511795409834-ef04bbd61622") },
      { type: "image", url: getImageUrl("1505373877841-8d25f7d46678") },
      { type: "video", url: getVideoUrl() },
    ],
    comments: [
      { id: 1, name: "Ahmadu Musa", comment: "God found me in this place. I'm forever grateful!" },
    ],
  },
  {
    id: 8,
    title: "A DAY OF BLESSINGS",
    location: "RIVERS STATE",
    date: "Aug 2023",
    image: getImageUrl("1497435332909-251e61e4e502", 680, 400),
    subtitle: "Port Harcourt Prisons",
    description: "Port Harcourt hosted this transformative prison ministry. The worship was powerful and the Word was received with open hearts. Testimonies of deliverance and salvation filled the air. The Spirit of God moved in miraculous ways.",
    type: "prison",
    media: [
      { type: "image", url: getImageUrl("1497435332909-251e61e4e502") },
      { type: "image", url: getImageUrl("1548554448-087ebf1e11e3") },
      { type: "video", url: getVideoUrl() },
      { type: "image", url: getImageUrl("1568808163202-efd7e7d63d77") },
    ],
    comments: [
      { id: 1, name: "Blessing Peters", comment: "My life will never be the same. Thank you!" },
      { id: 2, name: "Samuel Wodi", comment: "Freedom came to my soul!" },
    ],
  },
  {
    id: 9,
    title: "A DAY OF BLESSINGS",
    location: "ONLINE",
    date: "Jun 2024",
    image: getImageUrl("1505373877841-8d25f7d46678", 680, 400),
    subtitle: "Father's Day Special Service",
    description: "Honoring fathers with a special online service. The message focused on biblical manhood and fatherhood. Many men were challenged and encouraged to step into their God-given roles. The Holy Spirit ministered to families across the globe.",
    type: "online",
    media: [
      { type: "image", url: getImageUrl("1505373877841-8d25f7d46678") },
      { type: "image", url: getImageUrl("1568808163202-efd7e7d63d77") },
      { type: "image", url: getImageUrl("1507003211169-0a1dd7228f2d") },
      { type: "video", url: getVideoUrl() },
    ],
    comments: [
      { id: 1, name: "James Martinez", comment: "As a father, I needed this message. Powerful!" },
      { id: 2, name: "Robert Wilson", comment: "God touched my heart as a dad. Thank you!" },
    ],
  },
  {
    id: 10,
    title: "A DAY OF BLESSINGS",
    location: "ONLINE",
    date: "Jul 2024",
    image: getImageUrl("1568808163202-efd7e7d63d77", 680, 400),
    subtitle: "Summer Revival Stream",
    description: "Summer Revival Stream brought fresh fire online. The series focused on personal revival and walking in the Spirit. Thousands of viewers experienced spiritual refreshing and renewal. God's presence was tangible even through the digital platform.",
    type: "online",
    media: [
      { type: "image", url: getImageUrl("1568808163202-efd7e7d63d77") },
      { type: "image", url: getImageUrl("1548554448-f91b79b4d8c8") },
      { type: "image", url: getImageUrl("1505373877841-8d25f7d46678") },
      { type: "video", url: getVideoUrl() },
      { type: "image", url: getImageUrl("1497435332909-251e61e4e502") },
    ],
    comments: [
      { id: 1, name: "Jennifer Lee", comment: "Revival hit my home! God is amazing!" },
      { id: 2, name: "Mark Thompson", comment: "I was refreshed by the Spirit. Bless you all!" },
    ],
  },
];

