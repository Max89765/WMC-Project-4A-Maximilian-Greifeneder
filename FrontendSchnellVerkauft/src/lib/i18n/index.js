import { register, init, getLocaleFromNavigator } from 'svelte-i18n';
import { browser } from '$app/environment'; // 1. Browser-Check importieren

register('de', () => import('./de.json'));
register('en', () => import('./en.json'));

init({
    fallbackLocale: 'de',
    initialLocale: browser ? (window.localStorage.getItem('lang') ?? getLocaleFromNavigator()) : 'de',
});