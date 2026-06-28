const API_BASE = 'https://advent.qzz.io/public/api';
const CURRENT_DOMAIN = 'sdapermata.zone.id'; // Could be window.location.hostname

async function fetchAPI(endpoint) {
    try {
        const url = new URL(`${API_BASE}/${endpoint}`);
        url.searchParams.append('domain', CURRENT_DOMAIN);
        const response = await fetch(url.toString());
        const data = await response.json();
        if (data.status === 'success') {
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
        settings: {},
        sliders: [],
        pages: {},
        articles: [],
        serviceYears: 0,
        serviceMonths: 0,
        serviceDays: 0,
        isLoaded: false,
        
        async init() {
            // Fetch initial data
            const settingsData = await fetchAPI('settings');
            
            // Transform key-value settings if it returns an array of objects
            if (settingsData && Array.isArray(settingsData)) {
                let kv = {};
                settingsData.forEach(s => kv[s.key_name] = s.value);
                this.settings = kv;
            } else if (settingsData && typeof settingsData === 'object') {
                this.settings = settingsData;
            }

            // Calculate service duration
            const startDate = new Date('2024-01-27');
            const currentDate = new Date();
            let years = currentDate.getFullYear() - startDate.getFullYear();
            let months = currentDate.getMonth() - startDate.getMonth();
            if (months < 0 || (months === 0 && currentDate.getDate() < startDate.getDate())) {
                years--;
                months += 12;
            }
            this.serviceYears = years;
            this.serviceMonths = months;
            
            // Update document title and favicon
            if (this.settings.site_title) {
                document.title = this.settings.site_title;
            }
            if (this.settings.site_favicon) {
                let favUrl = this.settings.site_favicon.startsWith('http') ? this.settings.site_favicon : `https://advent.qzz.io/public/${this.settings.site_favicon}`;
                if (window.location.protocol === 'https:' && favUrl.startsWith('http://')) {
                    favUrl = favUrl.replace('http://', 'https://');
                }
                let link = document.querySelector("link[rel~='icon']");
                if (!link) {
                    link = document.createElement('link');
                    link.rel = 'icon';
                    document.getElementsByTagName('head')[0].appendChild(link);
                }
                link.href = favUrl;
            }

            this.isLoaded = true;

            // Inject Canonical URL to avoid Duplicate Content penalty (SEO)
            let canonical = document.querySelector("link[rel='canonical']");
            if (!canonical) {
                canonical = document.createElement('link');
                canonical.rel = 'canonical';
                document.head.appendChild(canonical);
            }
            
            let currentPath = window.location.pathname;
            let slugParam = new URLSearchParams(window.location.search).get('slug');
            let mappedPath = currentPath;
            
            if (currentPath.includes('article.html') && slugParam) {
                mappedPath = '/articles/detail/' + slugParam;
            } else {
                mappedPath = currentPath.replace('.html', '').replace('/index', '/');
            }
            
            // Format to ensure no double slashes except protocol
            let finalUrl = 'https://advent.qzz.io' + mappedPath;
            canonical.href = finalUrl.replace(/([^:])\/\//g, "`$1/");
        },
        
        async fetchSliders() {
            const data = await fetchAPI('sliders');
            if (data) {
                this.sliders = data.filter(s => s.is_active);
            }
        },
        
        async fetchPage(slug) {
            const data = await fetchAPI(`pages?slug=${slug}`);
            if (data && data.length > 0) {
                this.pages[slug] = data[0];
            } else if (data && data.slug) {
                this.pages[slug] = data; // If single object returned
            }
        },
        
        async fetchArticles(limit = 3) {
            // Adjust depending on actual API endpoint for articles
            const data = await fetchAPI('articles');
            if (data) {
                this.articles = data.slice(0, limit);
            }
        },
        
        async fetchInfos() {
            const data = await fetchAPI('infos');
            if (data) {
                this.infos = data;
            }
        },

        getLogoUrl() {
            if (!this.settings.site_logo) return '';
            let logoUrl = this.settings.site_logo.startsWith('http') ? this.settings.site_logo : `https://advent.qzz.io/public/${this.settings.site_logo}`;
            if (window.location.protocol === 'https:' && logoUrl.startsWith('http://')) {
                logoUrl = logoUrl.replace('http://', 'https://');
            }
            return logoUrl;
        }
    }));
});



