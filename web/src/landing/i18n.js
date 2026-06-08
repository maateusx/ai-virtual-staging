import { create } from 'zustand';

// Lightweight i18n for the marketing landing page (PT/EN).
// No external library — strings live here, language lives in a zustand store
// persisted to localStorage. Matches the project's existing zustand pattern.

export const translations = {
  pt: {
    nav: {
      features: 'Recursos',
      how: 'Como funciona',
      signin: 'Entrar',
      cta: 'Experimentar grátis',
    },
    hero: {
      badge: 'Virtual staging com IA',
      title: 'Transforme fotos de imóveis em segundos',
      subtitle:
        'Mobilie ambientes vazios, limpe espaços ocupados e melhore a qualidade das suas fotos — com IA, em tempo real.',
      ctaPrimary: 'Experimentar grátis',
      ctaSecondary: 'Ver como funciona',
      before: 'Antes',
      after: 'Depois',
      caption: 'Arraste para comparar',
    },
    modes: {
      label: 'Recursos',
      title: 'Cinco modos para cada situação',
      subtitle: 'Da casa vazia ao imóvel ocupado — uma ferramenta para todo o fluxo.',
      items: [
        { key: 'furnish', name: 'Mobiliar', desc: 'Adicione móveis e decoração a ambientes vazios em segundos.' },
        { key: 'empty', name: 'Esvaziar', desc: 'Remova todos os móveis e deixe o espaço limpo e neutro.' },
        { key: 'declutter', name: 'Minimizar', desc: 'Tire o excesso e mantenha só o essencial do ambiente.' },
        { key: 'enhance', name: 'Melhorar qualidade', desc: 'Recupere nitidez e detalhe em alta resolução, sem mudar a cena.' },
        { key: 'edit', name: 'Editar', desc: 'Pinte uma área e descreva a mudança — só ela é transformada.' },
      ],
    },
    how: {
      label: 'Como funciona',
      title: 'Três passos, um resultado',
      steps: [
        { name: 'Envie a foto', desc: 'Arraste a imagem do cômodo direto no navegador.' },
        { name: 'Escolha o modo', desc: 'Selecione o estilo, o tipo de ambiente e os parâmetros.' },
        { name: 'Receba o resultado', desc: 'Compare antes e depois e baixe em alta resolução.' },
      ],
    },
    diff: {
      label: 'Por que decorar.ai',
      title: 'Feito para vender mais rápido',
      items: [
        { name: 'Tempo real', desc: 'Resultado em segundos, sem fila e sem espera.' },
        { name: 'Custo transparente', desc: 'Veja a estimativa em USD/BRL antes de processar.' },
        { name: 'Várias variações', desc: 'Gere até 4 opções de uma vez e escolha a melhor.' },
        { name: 'Fidelidade total', desc: 'Geometria e perspectiva preservadas — sem alucinações.' },
      ],
    },
    stats: {
      label: 'Por que staging funciona',
      title: 'Os números provam: imóvel preparado vende mais',
      subtitle:
        'Pesquisas de mercado mostram o impacto do staging na velocidade de venda, no interesse do comprador e nos agendamentos.',
      items: [
        { value: 'até 50%', label: 'mais rápido para vender um imóvel preparado com staging', source: 'Exame' },
        { value: '83%', label: 'dos compradores visualizam melhor o imóvel como seu futuro lar', source: 'NAR' },
        { value: '+40%', label: 'mais visualizações no anúncio online', source: 'estudos de virtual staging' },
        { value: '+31%', label: 'mais contatos e agendamentos de visita', source: 'estudos de virtual staging' },
      ],
      note: 'Fontes: Exame (2024) e National Association of Realtors (NAR, 2025).',
    },
    faq: {
      label: 'Dúvidas',
      title: 'Perguntas frequentes',
      items: [
        {
          q: 'O que é a decorar.ai?',
          a: 'Uma plataforma de virtual staging com IA para fotos e vídeos de imóveis. Mobilia ambientes vazios, esvazia espaços ocupados e melhora a qualidade das imagens — tudo no navegador, em tempo real.',
        },
        {
          q: 'O que fazemos?',
          a: 'Transformamos fotos de imóveis: mobiliar ambientes vazios, esvaziar ou minimizar espaços ocupados, melhorar a qualidade da imagem e editar áreas específicas. Também geramos vídeos a partir das imagens.',
        },
        {
          q: 'O que preciso enviar?',
          a: 'Apenas a foto do cômodo. Arraste a imagem no navegador, escolha o modo, o estilo e o tipo de ambiente. Quanto melhor a foto original, melhor o resultado.',
        },
        {
          q: 'Qual é o diferencial?',
          a: 'Resultado em segundos, com geometria e perspectiva preservadas — sem alucinações. Você gera até 4 variações por vez e vê o custo estimado em USD/BRL antes de processar.',
        },
        {
          q: 'Qual a vantagem?',
          a: 'Imóveis preparados com staging vendem até 50% mais rápido (Exame) e 83% dos compradores visualizam melhor o imóvel como seu futuro lar (NAR) — mais visitas, contatos e propostas, por uma fração do custo de um staging físico.',
        },
        {
          q: 'Cobram por imagem ou vídeo?',
          a: 'Você usa créditos pré-pagos, consumidos conforme gera imagens ou vídeos, e vê a estimativa de custo antes de processar. Também pode usar sua própria chave de API (BYOK) e pagar direto ao provedor.',
        },
        {
          q: 'Quais são os prazos?',
          a: 'As imagens ficam prontas em segundos, em tempo real. Os vídeos levam de alguns minutos a algumas horas, dependendo da duração e da fila.',
        },
        {
          q: 'Para quem é a decorar.ai?',
          a: 'Para corretores, imobiliárias, fotógrafos de imóveis, home stagers e proprietários que querem anúncios mais atraentes e vendas mais rápidas.',
        },
        {
          q: 'Preciso contratar um fotógrafo?',
          a: 'Não. Você pode usar fotos do próprio celular — o modo de melhorar qualidade recupera nitidez e detalhe. Ainda assim, fotos bem iluminadas e niveladas sempre geram resultados melhores.',
        },
        {
          q: 'Posso fazer um teste?',
          a: 'Pode. É possível experimentar gratuitamente, sem instalar nada. Arraste uma foto e veja o antes e depois.',
        },
      ],
    },
    cta: {
      title: 'Pronto para vender mais rápido?',
      subtitle: 'Comece a transformar suas fotos agora. Sem instalação, sem espera.',
      button: 'Experimentar grátis',
    },
    footer: {
      tagline: 'Virtual staging com IA para fotos de imóveis.',
      columns: [
        { title: 'Produto', links: ['Recursos', 'Como funciona', 'Abrir app'] },
        { title: 'Modos', links: ['Mobiliar', 'Esvaziar', 'Melhorar qualidade'] },
        { title: 'Empresa', links: ['Sobre', 'Contato', 'Privacidade'] },
      ],
      rights: '© 2026 decorar.ai. Todos os direitos reservados.',
    },
  },

  es: {
    nav: {
      features: 'Recursos',
      how: 'Cómo funciona',
      signin: 'Entrar',
      cta: 'Probar gratis',
    },
    hero: {
      badge: 'Home staging virtual con IA',
      title: 'Transforma fotos de inmuebles en segundos',
      subtitle:
        'Amuebla ambientes vacíos, despeja espacios ocupados y mejora la calidad de tus fotos — con IA, en tiempo real.',
      ctaPrimary: 'Probar gratis',
      ctaSecondary: 'Ver cómo funciona',
      before: 'Antes',
      after: 'Después',
      caption: 'Arrastra para comparar',
    },
    modes: {
      label: 'Recursos',
      title: 'Cinco modos para cada situación',
      subtitle: 'De la casa vacía al inmueble ocupado — una herramienta para todo el flujo.',
      items: [
        { key: 'furnish', name: 'Amueblar', desc: 'Agrega muebles y decoración a ambientes vacíos en segundos.' },
        { key: 'empty', name: 'Vaciar', desc: 'Quita todos los muebles y deja el espacio limpio y neutro.' },
        { key: 'declutter', name: 'Despejar', desc: 'Elimina el exceso y conserva solo lo esencial del ambiente.' },
        { key: 'enhance', name: 'Mejorar calidad', desc: 'Recupera nitidez y detalle en alta resolución, sin cambiar la escena.' },
        { key: 'edit', name: 'Editar', desc: 'Pinta un área y describe el cambio — solo ella se transforma.' },
      ],
    },
    how: {
      label: 'Cómo funciona',
      title: 'Tres pasos, un resultado',
      steps: [
        { name: 'Sube la foto', desc: 'Arrastra la imagen de la habitación en el navegador.' },
        { name: 'Elige el modo', desc: 'Selecciona el estilo, el tipo de ambiente y los parámetros.' },
        { name: 'Recibe el resultado', desc: 'Compara antes y después y descarga en alta resolución.' },
      ],
    },
    diff: {
      label: 'Por qué decorar.ai',
      title: 'Hecho para vender más rápido',
      items: [
        { name: 'Tiempo real', desc: 'Resultado en segundos, sin colas ni esperas.' },
        { name: 'Costo transparente', desc: 'Mira la estimación en USD/BRL antes de procesar.' },
        { name: 'Varias variaciones', desc: 'Genera hasta 4 opciones a la vez y elige la mejor.' },
        { name: 'Fidelidad total', desc: 'Geometría y perspectiva preservadas — sin alucinaciones.' },
      ],
    },
    stats: {
      label: 'Por qué funciona el staging',
      title: 'Los números lo confirman: un inmueble preparado vende más',
      subtitle:
        'Estudios de mercado muestran el impacto del staging en la velocidad de venta, el interés del comprador y las visitas.',
      items: [
        { value: 'hasta 50%', label: 'más rápido para vender un inmueble preparado con staging', source: 'Exame' },
        { value: '83%', label: 'de los compradores visualiza mejor el inmueble como su futuro hogar', source: 'NAR' },
        { value: '+40%', label: 'más visualizaciones en el anuncio online', source: 'estudios de virtual staging' },
        { value: '+31%', label: 'más contactos y solicitudes de visita', source: 'estudios de virtual staging' },
      ],
      note: 'Fuentes: Exame (2024) y National Association of Realtors (NAR, 2025).',
    },
    faq: {
      label: 'Dudas',
      title: 'Preguntas frecuentes',
      items: [
        {
          q: '¿Qué es decorar.ai?',
          a: 'Una plataforma de virtual staging con IA para fotos y videos de inmuebles. Amuebla ambientes vacíos, vacía espacios ocupados y mejora la calidad de las imágenes — todo en el navegador, en tiempo real.',
        },
        {
          q: '¿Qué hacemos?',
          a: 'Transformamos fotos de inmuebles: amueblar ambientes vacíos, vaciar o despejar espacios ocupados, mejorar la calidad de la imagen y editar áreas específicas. También generamos videos a partir de las imágenes.',
        },
        {
          q: '¿Qué necesito enviar?',
          a: 'Solo la foto de la habitación. Arrastra la imagen en el navegador, elige el modo, el estilo y el tipo de ambiente. Cuanto mejor sea la foto original, mejor el resultado.',
        },
        {
          q: '¿Cuál es el diferencial?',
          a: 'Resultado en segundos, con geometría y perspectiva conservadas — sin alucinaciones. Generas hasta 4 variaciones a la vez y ves el costo estimado en USD/BRL antes de procesar.',
        },
        {
          q: '¿Cuál es la ventaja?',
          a: 'Los inmuebles preparados con staging se venden hasta un 50% más rápido (Exame) y el 83% de los compradores visualiza mejor el inmueble como su futuro hogar (NAR) — más visitas, contactos y ofertas, por una fracción del costo de un staging físico.',
        },
        {
          q: '¿Cobran por imagen o video?',
          a: 'Usas créditos prepagos, que se consumen al generar imágenes o videos, y ves la estimación de costo antes de procesar. También puedes usar tu propia clave de API (BYOK) y pagar directo al proveedor.',
        },
        {
          q: '¿Cuáles son los plazos?',
          a: 'Las imágenes están listas en segundos, en tiempo real. Los videos tardan de algunos minutos a algunas horas, según la duración y la cola.',
        },
        {
          q: '¿Para quién es decorar.ai?',
          a: 'Para agentes, inmobiliarias, fotógrafos de inmuebles, home stagers y propietarios que quieren anuncios más atractivos y ventas más rápidas.',
        },
        {
          q: '¿Necesito contratar un fotógrafo?',
          a: 'No. Puedes usar fotos de tu propio celular — el modo de mejorar calidad recupera nitidez y detalle. Aun así, las fotos bien iluminadas y niveladas siempre dan mejores resultados.',
        },
        {
          q: '¿Puedo hacer una prueba?',
          a: 'Sí. Puedes probar gratis, sin instalar nada. Arrastra una foto y mira el antes y después.',
        },
      ],
    },
    cta: {
      title: '¿Listo para vender más rápido?',
      subtitle: 'Empieza a transformar tus fotos ahora. Sin instalación, sin esperas.',
      button: 'Probar gratis',
    },
    footer: {
      tagline: 'Home staging virtual con IA para fotos de inmuebles.',
      columns: [
        { title: 'Producto', links: ['Recursos', 'Cómo funciona', 'Abrir app'] },
        { title: 'Modos', links: ['Amueblar', 'Vaciar', 'Mejorar calidad'] },
        { title: 'Empresa', links: ['Acerca de', 'Contacto', 'Privacidad'] },
      ],
      rights: '© 2026 decorar.ai. Todos los derechos reservados.',
    },
  },

  en: {
    nav: {
      features: 'Features',
      how: 'How it works',
      signin: 'Sign in',
      cta: 'Try it free',
    },
    hero: {
      badge: 'AI virtual staging',
      title: 'Transform real estate photos in seconds',
      subtitle:
        'Furnish empty rooms, clear occupied spaces and enhance your listing photos — with AI, in real time.',
      ctaPrimary: 'Try it free',
      ctaSecondary: 'See how it works',
      before: 'Before',
      after: 'After',
      caption: 'Drag to compare',
    },
    modes: {
      label: 'Features',
      title: 'Five modes for every situation',
      subtitle: 'From empty homes to occupied listings — one tool for the whole flow.',
      items: [
        { key: 'furnish', name: 'Furnish', desc: 'Add furniture and decor to empty rooms in seconds.' },
        { key: 'empty', name: 'Empty', desc: 'Remove all furniture for a clean, neutral space.' },
        { key: 'declutter', name: 'Declutter', desc: 'Strip the excess and keep only what matters.' },
        { key: 'enhance', name: 'Enhance', desc: 'Recover sharpness and detail in high resolution, scene intact.' },
        { key: 'edit', name: 'Edit', desc: 'Paint an area, describe the change — only it transforms.' },
      ],
    },
    how: {
      label: 'How it works',
      title: 'Three steps, one result',
      steps: [
        { name: 'Upload the photo', desc: 'Drag the room image right into your browser.' },
        { name: 'Pick the mode', desc: 'Choose the style, room type and parameters.' },
        { name: 'Get the result', desc: 'Compare before and after and download in high resolution.' },
      ],
    },
    diff: {
      label: 'Why decorar.ai',
      title: 'Built to sell faster',
      items: [
        { name: 'Real time', desc: 'Results in seconds, no queue and no waiting.' },
        { name: 'Transparent cost', desc: 'See the USD/BRL estimate before you process.' },
        { name: 'Multiple variations', desc: 'Generate up to 4 options at once and pick the best.' },
        { name: 'Full fidelity', desc: 'Geometry and perspective preserved — no hallucinations.' },
      ],
    },
    stats: {
      label: 'Why staging works',
      title: 'The numbers prove it: a staged listing sells more',
      subtitle:
        "Market research shows staging's impact on sale speed, buyer interest and showing requests.",
      items: [
        { value: 'up to 50%', label: 'faster to sell a property prepared with staging', source: 'Exame' },
        { value: '83%', label: 'of buyers picture the home as their future home more easily', source: 'NAR' },
        { value: '+40%', label: 'more views on the online listing', source: 'virtual staging studies' },
        { value: '+31%', label: 'more inquiries and showing requests', source: 'virtual staging studies' },
      ],
      note: 'Sources: Exame (2024) and the National Association of Realtors (NAR, 2025).',
    },
    faq: {
      label: 'Questions',
      title: 'Frequently asked questions',
      items: [
        {
          q: 'What is decorar.ai?',
          a: 'An AI virtual staging platform for real estate photos and videos. It furnishes empty rooms, clears occupied spaces and enhances image quality — all in the browser, in real time.',
        },
        {
          q: 'What do we do?',
          a: 'We transform real estate photos: furnish empty rooms, empty or declutter occupied spaces, enhance image quality and edit specific areas. We also generate videos from the images.',
        },
        {
          q: 'What do I need to send?',
          a: 'Just the photo of the room. Drag the image into the browser, choose the mode, the style and the room type. The better the original photo, the better the result.',
        },
        {
          q: 'What sets it apart?',
          a: 'Results in seconds, with geometry and perspective preserved — no hallucinations. You generate up to 4 variations at once and see the estimated cost in USD/BRL before you process.',
        },
        {
          q: 'What is the advantage?',
          a: 'Staged properties sell up to 50% faster (Exame) and 83% of buyers picture the home as their future home more easily (NAR) — more showings, inquiries and offers, at a fraction of the cost of physical staging.',
        },
        {
          q: 'Do you charge per image or video?',
          a: 'You use prepaid credits, consumed as you generate images or videos, and you see the cost estimate before processing. You can also use your own API key (BYOK) and pay the provider directly.',
        },
        {
          q: 'What are the turnaround times?',
          a: 'Images are ready in seconds, in real time. Videos take from a few minutes to a few hours, depending on length and queue.',
        },
        {
          q: 'Who is decorar.ai for?',
          a: 'For agents, real estate agencies, property photographers, home stagers and owners who want more attractive listings and faster sales.',
        },
        {
          q: 'Do I need to hire a photographer?',
          a: 'No. You can use photos from your own phone — the enhance mode recovers sharpness and detail. That said, well-lit, level photos always produce better results.',
        },
        {
          q: 'Can I try it?',
          a: 'Yes. You can try it for free, with no install. Drag a photo and see the before and after.',
        },
      ],
    },
    cta: {
      title: 'Ready to sell faster?',
      subtitle: 'Start transforming your photos now. No install, no waiting.',
      button: 'Try it free',
    },
    footer: {
      tagline: 'AI virtual staging for real estate photos.',
      columns: [
        { title: 'Product', links: ['Features', 'How it works', 'Open app'] },
        { title: 'Modes', links: ['Furnish', 'Empty', 'Enhance'] },
        { title: 'Company', links: ['About', 'Contact', 'Privacy'] },
      ],
      rights: '© 2026 decorar.ai. All rights reserved.',
    },
  },
};

const STORAGE_KEY = 'decorar.lang';
export const SUPPORTED_LANGS = ['pt', 'en', 'es'];

function detectBrowserLang() {
  if (typeof navigator === 'undefined') return 'en';
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of candidates) {
    const prefix = (tag || '').toLowerCase().split('-')[0];
    if (SUPPORTED_LANGS.includes(prefix)) return prefix;
  }
  return 'en'; // fallback
}

function initialLang() {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED_LANGS.includes(saved)) return saved;
  }
  return detectBrowserLang();
}

const useLangStore = create((set) => ({
  lang: initialLang(),
  setLang: (lang) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, lang);
    set({ lang });
  },
}));

// Hook used by landing components.
// `t` is the full translation dictionary for the active language.
export function useLang() {
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  return { lang, setLang, t: translations[lang] };
}
