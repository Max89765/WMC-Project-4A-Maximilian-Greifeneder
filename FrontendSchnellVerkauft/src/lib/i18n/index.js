// svelte-i18n Setup // help with ai – npm install svelte-i18n
import { register, init, getLocaleFromNavigator } from 'svelte-i18n';

register('de', () => import('./de.json'));
register('en', () => import('./en.json'));

init({
    fallbackLocale: 'de',
    initialLocale: localStorage.getItem('lang') ?? getLocaleFromNavigator() ?? 'de',
});
