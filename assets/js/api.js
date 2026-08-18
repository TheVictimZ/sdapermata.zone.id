const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
    ? 'http://localhost/016/online_server/advent/public/api' 
    : 'https://advent.qzz.io/public/api';
const CURRENT_DOMAIN = 'permata.env.pm';

async function fetchAPI(endpoint) {
    try {
        const url = new URL(`${API_BASE}/${endpoint}`);
        const domainToUse = (window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') ? window.location.hostname : CURRENT_DOMAIN;
        url.searchParams.append('domain', domainToUse);
        const response = await fetch(url.toString());
        const data = await response.json();
        if (data && data.status === 'success') {
            return data.data;
        }
        return null;
    } catch (e) {
        console.error('API Fetch Error:', e);
        return null;
    }
}

document.addEventListener('alpine:init', () => {
    Alpine.data('appData', () => ({
        darkMode: localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches),
        settings: {},
        sliders: [],
        pages: {},
        articles: [],
        members: [],
        histories: [],
        jemaatInfo: [],
        monitoredDomains: [],
        membersCount: 1,
        serviceYears: 0,
        serviceMonths: 0,
        isLoaded: false,
        
        async init() {
            // Fetch initial settings
            const settingsData = await fetchAPI('settings');
            
            if (settingsData && Array.isArray(settingsData)) {
                let kv = {};
                settingsData.forEach(s => kv[s.key_name] = s.value);
                this.settings = kv;
            } else if (settingsData && typeof settingsData === 'object') {
                this.settings = settingsData;
            }

            // Normalize Contact Info Keys
            if (this.settings.contact_address && !this.settings.site_address) this.settings.site_address = this.settings.contact_address;
            if (this.settings.site_address && !this.settings.contact_address) this.settings.contact_address = this.settings.site_address;
            if (this.settings.contact_phone && !this.settings.site_phone) this.settings.site_phone = this.settings.contact_phone;
            if (this.settings.site_phone && !this.settings.contact_phone) this.settings.contact_phone = this.settings.site_phone;
            if (this.settings.contact_email && !this.settings.site_email) this.settings.site_email = this.settings.contact_email;
            if (this.settings.site_email && !this.settings.contact_email) this.settings.contact_email = this.settings.site_email;

            // Normalize Social Media Links
            if (!this.settings.social_facebook) this.settings.social_facebook = 'https://www.facebook.com/sda.permata';
            if (!this.settings.social_youtube)  this.settings.social_youtube  = 'https://www.youtube.com/@HopeChannelIndonesiaTV';
            if (!this.settings.social_instagram) this.settings.social_instagram = 'https://www.instagram.com/sda.permata/';
            if (!this.settings.social_whatsapp) this.settings.social_whatsapp = 'https://wa.me/6287742466477';
            if (!this.settings.social_github)   this.settings.social_github   = 'https://github.com/TheVictimZ';

            // Fetch members count and list
            await this.fetchMembers();

            // Calculate service duration
            const startDate = new Date('2024-01-27');
            const currentDate = new Date();
            let years = currentDate.getFullYear() - startDate.getFullYear();
            let months = currentDate.getMonth() - startDate.getMonth();
            if (months < 0 || (months === 0 && currentDate.getDate() < startDate.getDate())) {
                years--;
                months += 12;
            }
            this.serviceYears = Math.max(1, years);
            this.serviceMonths = months;
            
            // Update favicon if provided
            if (this.settings.site_favicon) {
                let favUrl = this.settings.site_favicon.startsWith('http') ? this.settings.site_favicon : `https://advent.qzz.io/public/${this.settings.site_favicon.replace(/^\//, '')}`;
                favUrl = favUrl.replace('http://advent.qzz.io', 'https://advent.qzz.io');
                let link = document.querySelector("link[rel~='icon']");
                if (!link) {
                    link = document.createElement('link');
                    link.rel = 'icon';
                    document.getElementsByTagName('head')[0].appendChild(link);
                }
                link.href = favUrl;
            }

            this.isLoaded = true;
        },
        
        async fetchSliders() {
            const data = await fetchAPI('sliders');
            if (data && Array.isArray(data)) {
                this.sliders = data.filter(s => s.is_active == 1 || s.is_active == true || s.is_active === undefined);
            }
        },
        
        async fetchPage(slug) {
            const data = await fetchAPI(`pages?slug=${slug}`);
            if (data && Array.isArray(data) && data.length > 0) {
                this.pages[slug] = data[0];
            } else if (data && data.slug) {
                this.pages[slug] = data;
            }
        },
        
        async fetchArticles(limit = 6) {
            const data = await fetchAPI('articles');
            if (data && Array.isArray(data)) {
                this.articles = limit > 0 ? data.slice(0, limit) : data;
            }
        },

        async fetchHistories() {
            const data = await fetchAPI('histories');
            if (data && Array.isArray(data)) {
                this.histories = data.sort((a, b) => parseInt(a.year) - parseInt(b.year));
            }
        },

        async fetchJemaatInfo() {
            const data = await fetchAPI('jemaat_info');
            if (data && Array.isArray(data)) {
                this.jemaatInfo = data;
            }
        },

        async fetchMembers() {
            const data = await fetchAPI('members');
            if (data && Array.isArray(data)) {
                this.members = data;
                this.membersCount = data.length;
            }
        },

        async fetchMonitoredDomains() {
            const data = await fetchAPI('monitored_domains');
            if (data && Array.isArray(data)) {
                this.monitoredDomains = data;
            }
        },

        getArticleImage(article) {
            if (!article) return 'https://images.unsplash.com/photo-1507692049790-de58293a469d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
            let url = '';
            if (article.thumbnail_path) {
                url = article.thumbnail_path;
            } else if (article.image_path) {
                url = article.image_path;
            } else if (article.content) {
                const match = article.content.match(/<img[^>]+src=["']([^"']+)["']/i);
                if (match && match[1]) url = match[1];
            }
            if (!url) return 'https://images.unsplash.com/photo-1507692049790-de58293a469d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
            return this.getUploadUrl(url);
        },

        getLogoUrl() {
            if (!this.settings.site_logo) return '';
            return this.getUploadUrl(this.settings.site_logo);
        },

        getUploadUrl(path) {
            if (!path) return '';
            if (path.startsWith('http') || path.startsWith('data:')) {
                return path.replace('http://advent.qzz.io', 'https://advent.qzz.io');
            }
            
            let baseUrl = 'https://advent.qzz.io/public';
            let cleanPath = path.replace(/^\//, '');
            
            if (cleanPath.startsWith('uploads/')) {
                return `${baseUrl}/${cleanPath}`;
            }
            
            if (cleanPath.includes('site_')) {
                return `${baseUrl}/uploads/${cleanPath}`;
            }
            
            return `${baseUrl}/uploads/content/${cleanPath}`;
        }
    }));
});


