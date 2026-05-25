import { useState } from 'react';
import { Tag, Card, Button } from 'antd';
import { 
    SearchOutlined, BookOutlined, WalletOutlined, 
    LineChartOutlined, BulbOutlined, MailOutlined,
    QuestionCircleOutlined, InfoCircleOutlined, CheckCircleOutlined,
    RightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const ARTICLES = [
    {
        id: 'getting-started',
        category: 'Getting Started',
        icon: <BookOutlined style={{ color: '#6366F1', fontSize: 18 }} />,
        title: 'Introduction to Money Matters AI',
        content: `Welcome to Money Matters AI! This personal finance companion helps you manage your budgets, track your spending, and analyze stocks with the help of artificial intelligence.
        
        To get started:
        1. Log your first transaction in the "Transactions" tab.
        2. Set up limits for categories you want to track in the "Budgets" tab.
        3. Add your favorite stocks in the "Stocks" tab to track their live performance.`
    },
    {
        id: 'transaction-tracking',
        category: 'Transactions',
        icon: <InfoCircleOutlined style={{ color: '#10B981', fontSize: 18 }} />,
        title: 'How to Log and Manage Transactions',
        content: `You can log both Income (credit) and Expenses (debit) on the Transactions page.
        
        • Choose standard categories like Food & Dining, Utilities, Transport, Shopping, or Health.
        • Our backend utilizes a custom NLP model tailored for Indian spending patterns (like Swiggy, Zomato, local kiranas) to understand transaction patterns.
        • All transactions are synced live with a secure Supabase database.`
    },
    {
        id: 'budgeting-alerts',
        category: 'Budgets & Alerts',
        icon: <WalletOutlined style={{ color: '#F59E0B', fontSize: 18 }} />,
        title: 'Understanding Budgets and Automatic Alerts',
        content: `Setting monthly budgets is a great way to limit your spends.
        
        • Go to the "Budgets" tab and select a category and monthly limit.
        • Our real-time notification engine triggers alert banners in the header:
          - Budget Alert (Spent >= 80%): Warns you when you are approaching your limit.
          - Budget Exceeded (Spent > 100%): Alerts you when you have gone over your limit.
        • If you increase your budget limit or delete expenses, the alert automatically disappears from your notifications tray.`
    },
    {
        id: 'stock-portfolio',
        category: 'Stocks & Portfolio',
        icon: <LineChartOutlined style={{ color: '#3B82F6', fontSize: 18 }} />,
        title: 'Using Stock Watchlist & Comparison',
        content: `The Stock Analyser is a powerful tool to track market performance.
        
        • Watchlist: Add stocks to your personal Watchlist by clicking the bookmark/watchlist button. Watchlist data is saved securely in your browser cache.
        • Comparison Page: Compare up to 5 stocks side-by-side. 
          - Press the "+ Add to Compare" button to add a stock.
          - Click "Clear All" to start fresh.
          - Your selected comparison stocks are saved automatically, so you won't lose them when navigating back.`
    },
    {
        id: 'stock-signals',
        category: 'Stocks & Portfolio',
        icon: <CheckCircleOutlined style={{ color: '#10B981', fontSize: 18 }} />,
        title: 'AI Prediction Confidence Scores',
        content: `On the Stock Comparison page, signal cards display an AI prediction (e.g. BUY, SELL, or HOLD) along with a Confidence Score.
        
        • What is the score? The score represents the machine learning model's confidence in its technical pattern classification.
        • Corrected Formatting: The score displays in a standard percentage (e.g., 59% or 72%) to reflect model confidence accurately, avoiding the 5900% display bug.`
    },
    {
        id: 'ai-advisor',
        category: 'AI Advisor',
        icon: <BulbOutlined style={{ color: '#8B5CF6', fontSize: 18 }} />,
        title: 'Getting Personalized AI Financial Advice',
        content: `The AI Advisor is powered by a custom LLaMA-3 model fine-tuned for financial advisory.
        
        • How to use: Click the "Get Advice" button in the AI Advisor widget on the dashboard.
        • How it works: It securely analyzes your current month's spending patterns, budget limits, and income to give you personalized suggestions on how to save more and optimize your budget.`
    }
];

const FAQS = [
    {
        q: "Is my personal financial data secure?",
        a: "Yes! Money Matters AI uses Supabase, built on top of enterprise-grade PostgreSQL with Row Level Security (RLS). Only you can access or modify your budgets and transactions."
    },
    {
        q: "Why does my stock comparison list persist?",
        a: "We save your comparison list in your browser's local storage under 'mm_compare_stocks'. This ensures that navigating back and forth between stock pages won't wipe out your selections, unless you explicitly click the 'Clear All' button."
    },
    {
        q: "How does the AI Advisor know what advice to give?",
        a: "The AI Advisor reads your aggregate category spending, remaining budget balances, and transaction history. It matches these patterns against general financial best practices to generate actionable, tailored tips."
    },
    {
        q: "How do I report a bug or request a feature?",
        a: "You can use our Contact page or send an email to money.matters.ai.2026@gmail.com. We respond to all inquiries within 24 hours."
    }
];

function FAQItem({ faq }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div style={S.faqItem}>
            <div style={S.faqHeader} onClick={() => setIsOpen(!isOpen)}>
                <span style={S.faqQuestion}>{faq.q}</span>
                <RightOutlined rotate={isOpen ? 90 : 0} style={{ color: '#6366F1', fontSize: 12, transition: 'transform 200ms' }} />
            </div>
            {isOpen && (
                <div style={S.faqBody}>
                    <p style={S.faqAnswer}>{faq.a}</p>
                </div>
            )}
        </div>
    );
}

export default function HelpDocs() {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const filteredArticles = ARTICLES.filter(art => 
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={S.pageWrapper}>
            <div style={S.innerContainer}>
                
                {/* Header Search Hero (Dark styled) */}
                <div style={S.hero}>
                    <BookOutlined style={{ fontSize: 32, color: '#6366F1', marginBottom: 12 }} />
                    <h1 style={S.heroTitle}>Help Center</h1>
                    <p style={S.heroSub}>Find answers, learn about features, and get the most out of Money Matters AI.</p>
                    <div style={S.searchWrapper}>
                        <div style={S.searchBarContainer}>
                            <SearchOutlined style={{ color: '#94A3B8', marginRight: 10, fontSize: 16 }} />
                            <input
                                type="text"
                                placeholder="Search for articles (e.g. budgets, stocks, advisor...)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={S.searchInput}
                            />
                        </div>
                    </div>
                </div>

                {/* Articles Grid */}
                <div style={{ marginBottom: 40 }}>
                    <h2 style={S.sectionTitle}>Guides & Documentation</h2>
                    {filteredArticles.length === 0 ? (
                        <div style={S.emptyCard}>
                            <QuestionCircleOutlined style={{ fontSize: 24, color: '#475569', marginBottom: 8 }} />
                            <div style={{ fontSize: 14, color: '#94A3B8' }}>No help articles matched "{searchQuery}"</div>
                        </div>
                    ) : (
                        <div style={S.grid}>
                            {filteredArticles.map(art => (
                                <Card 
                                    key={art.id} 
                                    style={S.articleCard}
                                    styles={{ body: { padding: 24 } }}
                                >
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
                                        <div style={S.iconBox}>{art.icon}</div>
                                        <div>
                                            <Tag color="purple" style={S.tag}>{art.category}</Tag>
                                            <h3 style={S.articleTitle}>{art.title}</h3>
                                        </div>
                                    </div>
                                    <p style={S.articleText}>{art.content}</p>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* FAQs Accordion */}
                <div style={{ marginBottom: 48 }}>
                    <h2 style={S.sectionTitle}>Frequently Asked Questions</h2>
                    <div style={S.accordionWrapper}>
                        {FAQS.map((faq, idx) => (
                            <FAQItem key={idx} faq={faq} />
                        ))}
                    </div>
                </div>

                {/* Contact Support Footer Card */}
                <Card style={S.supportCard} styles={{ body: { padding: 28 } }}>
                    <div style={S.supportLayout}>
                        <div>
                            <h3 style={S.supportTitle}>Still need help?</h3>
                            <p style={S.supportText}>Can't find the answer you are looking for? Send us a message and we'll get back to you within 24 hours.</p>
                        </div>
                        <div style={S.supportBtns}>
                            <Button 
                                type="primary" 
                                icon={<MailOutlined />} 
                                onClick={() => navigate('/contact')}
                                style={S.supportBtnPrimary}
                            >
                                Contact Support
                            </Button>
                            <a href="mailto:money.matters.ai.2026@gmail.com" style={S.supportEmail}>
                                money.matters.ai.2026@gmail.com
                            </a>
                        </div>
                    </div>
                </Card>

            </div>
        </div>
    );
}

const S = {
    pageWrapper: {
        background: '#0B0F19',
        minHeight: 'calc(100vh - 60px)',
        color: '#94A3B8',
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        margin: 0,
        padding: '32px 0 64px',
        boxSizing: 'border-box'
    },
    innerContainer: {
        maxWidth: 840,
        margin: '0 auto',
        padding: '0 20px',
        boxSizing: 'border-box'
    },
    hero: {
        background: '#131720',
        borderRadius: 16,
        padding: '40px 24px',
        textAlign: 'center',
        color: '#F1F5F9',
        marginBottom: 40,
        border: '1px solid #252D3D',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: 800,
        color: '#F1F5F9',
        margin: '0 0 8px',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    },
    heroSub: {
        fontSize: 14.5,
        color: '#94A3B8',
        maxWidth: 500,
        margin: '0 auto 24px',
        lineHeight: 1.6
    },
    searchWrapper: {
        maxWidth: 540,
        margin: '0 auto'
    },
    searchBarContainer: {
        display: 'flex',
        alignItems: 'center',
        background: '#0B0F19',
        border: '1px solid #252D3D',
        borderRadius: 8,
        padding: '8px 16px',
        boxSizing: 'border-box'
    },
    searchInput: {
        background: 'transparent',
        border: 'none',
        outline: 'none',
        color: '#F1F5F9',
        fontSize: 14.5,
        width: '100%',
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif"
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: 700,
        color: '#F1F5F9',
        marginBottom: 20,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
        gap: 20
    },
    articleCard: {
        borderRadius: 14,
        border: '1px solid #252D3D',
        background: '#131720',
        height: '100%',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        background: '#1A202E',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: '1px solid #252D3D'
    },
    tag: {
        fontSize: 9.5,
        fontWeight: 700,
        textTransform: 'uppercase',
        marginBottom: 4,
        display: 'inline-block',
        background: '#1A202E',
        color: '#8B5CF6',
        border: '1px solid #252D3D'
    },
    articleTitle: {
        fontSize: 15.5,
        fontWeight: 700,
        color: '#F1F5F9',
        margin: 0,
        lineHeight: 1.3
    },
    articleText: {
        fontSize: 13.5,
        color: '#94A3B8',
        lineHeight: 1.7,
        margin: '14px 0 0',
        whiteSpace: 'pre-line'
    },
    emptyCard: {
        textAlign: 'center',
        padding: '40px 16px',
        borderRadius: 14,
        border: '1px dashed #252D3D',
        background: '#131720'
    },
    accordionWrapper: {
        border: '1px solid #252D3D',
        borderRadius: 14,
        overflow: 'hidden',
        background: '#131720'
    },
    faqItem: {
        borderBottom: '1px solid #252D3D'
    },
    faqHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '18px 24px',
        cursor: 'pointer',
        userSelect: 'none'
    },
    faqQuestion: {
        fontSize: 14,
        fontWeight: 600,
        color: '#F1F5F9'
    },
    faqBody: {
        padding: '0 24px 20px',
        background: '#131720'
    },
    faqAnswer: {
        fontSize: 13.5,
        color: '#94A3B8',
        lineHeight: 1.7,
        margin: 0
    },
    supportCard: {
        borderRadius: 16,
        border: '1px solid #252D3D',
        background: '#131720',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    },
    supportLayout: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 24
    },
    supportTitle: {
        fontSize: 17,
        fontWeight: 700,
        color: '#F1F5F9',
        margin: '0 0 6px'
    },
    supportText: {
        fontSize: 13.5,
        color: '#94A3B8',
        margin: 0,
        maxWidth: 480,
        lineHeight: 1.6
    },
    supportBtns: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 10,
        minWidth: 200
    },
    supportBtnPrimary: {
        borderRadius: 8,
        height: 40,
        fontWeight: 600,
        background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
        border: 'none',
        width: '100%',
        color: '#fff'
    },
    supportEmail: {
        fontSize: 12.5,
        color: '#6366F1',
        textDecoration: 'none',
        fontWeight: 600,
        alignSelf: 'center'
    }
};
