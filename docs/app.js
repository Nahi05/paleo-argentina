//empieza el mapa
const map= L.map('map', {preferCanvas: true,
    minZoom: 4,
    maxBounds: [
        [-58, -76],
        [-20, -52]
    ],
    maxBoundsViscosity: 0.8
});

L.control.scale({ metric: true, imperial: false, position: 'bottomleft' }).addTo(map);

map.fitBounds([[-55, -73], [-21, -53]], {
    paddingTopLeft: [0, 70],
    paddingBottomRight: [0, 160]
});

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Imágenes: Esri, Maxar, Earthstar Geographics y la comunidad de usuarios GIS',
    maxZoom: 12,
    className: 'mapa-satelital'
}).addTo(map);

const ETAPAS= [
    'Olenekian','Anisian','Ladinian','Carnian','Norian','Rhaetian',
    'Hettangian','Sinemurian','Pliensbachian','Toarcian','Aalenian',
    'Bajocian','Bathonian','Callovian','Oxfordian','Kimmeridgian','Tithonian',
    'Berriasian','Valanginian','Hauterivian','Barremian','Aptian','Albian',
    'Cenomanian','Turonian','Coniacian','Santonian','Campanian','Maastrichtian'
];
//agrupo los fosiles por etapas
const fosilesPorEtapa= {};
ETAPAS.forEach(etapa =>fosilesPorEtapa[etapa] =[]);
FOSILES.forEach(fosil => {
    if (fosilesPorEtapa[fosil.etapa]){
        fosilesPorEtapa[fosil.etapa].push(fosil);
    }
});

//grupo q se llena y vacia en el slider
let capaActual= L.layerGroup().addTo(map);
const slider= document.getElementById('slider');
const etapaNombre= document.getElementById('etapaNombre');
const contador= document.getElementById('contador')
const chkFauna= document.getElementById('chkFauna');
const chkFlora= document.getElementById('chkFlora');
const chkSaur = document.getElementById('chkSaur');
const chkOrni = document.getElementById('chkOrni');

const selProv= document.getElementById('selProv');

const provincias = [...new Set(FOSILES.map(f => f.provincia).filter(Boolean))].sort();
provincias.forEach(p => {
    const opcion = document.createElement('option');
    opcion.value = p;
    opcion.textContent = p;
    selProv.appendChild(opcion);
});

const ETAPAS_ES = {
    Olenekian:'Oleneckiense', Anisian:'Anisiense', Ladinian:'Ladiniense', Carnian:'Carniense',
    Norian:'Noriense', Rhaetian:'Retiense', Hettangian:'Hettangiense', Sinemurian:'Sinemuriense',
    Pliensbachian:'Pliensbachiense', Toarcian:'Toarciense', Aalenian:'Aaleniense',
    Bajocian:'Bajociense', Bathonian:'Bathoniense', Callovian:'Calloviense',
    Oxfordian:'Oxfordiense', Kimmeridgian:'Kimmeridgiense', Tithonian:'Titoniense',
    Berriasian:'Berriasiense', Valanginian:'Valanginiense', Hauterivian:'Hauteriviense',
    Barremian:'Barremiense', Aptian:'Aptiense', Albian:'Albiense', Cenomanian:'Cenomaniense',
    Turonian:'Turoniense', Coniacian:'Coniaciense', Santonian:'Santoniense',
    Campanian:'Campaniense', Maastrichtian:'Maastrichtiense'
};

function periodoDe(etapa) {
    const i = ETAPAS.indexOf(etapa);
    if (i <= 5) return 'Triásico';
    if (i <= 16) return 'Jurásico';
    return 'Cretácico';
}

const panelDet = document.getElementById('panelDet');

function mostrarDetalle(fosil) {
    document.getElementById('detNom').textContent = fosil.nombre || 'Sin identificar';
    document.getElementById('detTipo').textContent = fosil.esDino ? 'Dinosaurio' : fosil.tipo;
    document.getElementById('detPeriodo').textContent =
        `${periodoDe(fosil.etapa)} · ${ETAPAS_ES[fosil.etapa]} (≈ ${fosil.edadMa ?? '-'} Ma)`;
    document.getElementById('detUbicacion').textContent =
        `${fosil.provincia || '-'}${fosil.formacion ? ' · Fm. ' + fosil.formacion : ''}`;
    document.getElementById('detFam').textContent = fosil.familia || '-';
    panelDet.classList.add('abierto');
}

document.getElementById('cerrarDet').addEventListener('click', () => {
    panelDet.classList.remove('abierto');
});

function colorDe(fosil) {
    if (fosil.esDino) return fosil.clase === 'Ornithischia' ? '#f2c94c' : '#e8613c';
    return fosil.tipo === 'Flora' ? '#5cb85c' : '#4f9dd9';
}

const buscador = document.getElementById('buscador');

function normalizar(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

const resultadosBusqueda = document.getElementById('resultadosBusqueda');

function coincide(fosil, busqueda) {
    const texto = [fosil.nombre, fosil.genero, fosil.familia].filter(Boolean).join(' ');
    return normalizar(texto).includes(busqueda);
}

function actualizarResultadosBusqueda(busqueda) {
    if (!busqueda) {
        resultadosBusqueda.innerHTML = '';
        return;
    }
    const indices = [];
    ETAPAS.forEach((etapa, i) => {
        if (fosilesPorEtapa[etapa].some(f => coincide(f, busqueda))) indices.push(i);
    });

    if (indices.length === 0) {
        resultadosBusqueda.textContent = 'No hay resultados en ninguna etapa.';
        return;
    }
    const enlaces = indices.slice(0, 6).map(i =>
        `<a href="#" data-etapa="${i}">${ETAPAS_ES[ETAPAS[i]]}</a>`);
    const resto = indices.length > 6 ? ` y ${indices.length - 6} más` : '';
    resultadosBusqueda.innerHTML = 'Aparece en: ' + enlaces.join(', ') + resto;
}

resultadosBusqueda.addEventListener('click', e => {
    const a = e.target.closest('a[data-etapa]');
    if (!a) return;
    e.preventDefault();
    slider.value = a.dataset.etapa;
    dibuEtapa(parseInt(slider.value));
});

function dibuEtapa(indice) {
    const etapa= ETAPAS[indice];
    const fosilesDeEstaEtapa= fosilesPorEtapa[etapa];

    //borra los puntos anteriores
    capaActual.clearLayers()
    let mostrados= 0;

    const busqueda = normalizar(buscador.value.trim());

    //nuevos puntos
    fosilesDeEstaEtapa.forEach(fosil =>{
        if (busqueda && !coincide(fosil, busqueda)) return;
        if (fosil.esDino && fosil.clase === 'Ornithischia' && !chkOrni.checked) return;
        if (fosil.esDino && fosil.clase !== 'Ornithischia' && !chkSaur.checked) return;
        if (!fosil.esDino && fosil.tipo === "Fauna" && !chkFauna.checked) return;
        if (fosil.tipo === "Flora" && !chkFlora.checked) return;
        if (selProv.value !== 'Todas' && fosil.provincia !== selProv.value) return;

        const color = colorDe(fosil);

        L.circleMarker([fosil.lat, fosil.lng], {
            radius: fosil.esDino ? 7 : 4,
            color: color,
            fillColor: color,
            fillOpacity: 0.7,
            weight: fosil.esDino ? 1.5:0.5
        })
        .on('click', () => mostrarDetalle(fosil))
        .addTo(capaActual);
        mostrados++;
    });
    //texto del panel
    etapaNombre.textContent= ETAPAS_ES[etapa];
    contador.textContent = mostrados.toLocaleString('es-AR') + (mostrados === 1 ? ' registro' : ' registros');
    actualizarResultadosBusqueda(busqueda);
}

slider.addEventListener('input', () => dibuEtapa(parseInt(slider.value)));
chkFauna.addEventListener('change', () => dibuEtapa(parseInt(slider.value)));
chkFlora.addEventListener('change', () => dibuEtapa(parseInt(slider.value)));
chkSaur.addEventListener('change', () => dibuEtapa(parseInt(slider.value)));
chkOrni.addEventListener('change', () => dibuEtapa(parseInt(slider.value)));
selProv.addEventListener('change', () => dibuEtapa(parseInt(slider.value)));
buscador.addEventListener('input', () => dibuEtapa(parseInt(slider.value)));

fetch('argentina.geojson')
    .then(r => r.json())
    .then(datos => {
        L.geoJSON(datos, {
            style: { fill:false , color: '#e9e8fb', weight: 1.5 }
        }).addTo(map).bringToBack();
    });

function etiqueta(lat, lng, texto, clase) {
    L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'etiqueta-mapa ' + (clase || ''),
            html: texto,
            iconSize: [160, 20]
        }),
        interactive: false
    }).addTo(map);
}
etiqueta(-51.7, -59.5, 'Islas Malvinas');
etiqueta(-36, -73.5, 'Chile');
etiqueta(-19, -64.5, 'Bolivia');
etiqueta(-23.5, -57.5, 'Paraguay');
etiqueta(-22, -52, 'Brasil');
etiqueta(-33, -55.8, 'Uruguay');
etiqueta(-44, -77, 'Océano Pacífico', 'etiqueta-oceano');
etiqueta(-44, -53, 'Océano Atlántico', 'etiqueta-oceano');
dibuEtapa(0);
