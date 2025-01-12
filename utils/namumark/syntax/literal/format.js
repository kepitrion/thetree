const {
    validateHTMLColorHex,
    validateHTMLColorName
} = require('validate-color');
const sanitizeHtml = require('sanitize-html');

const utils = require('../../utils');
const CSSFilter = require('./cssFilter');

const sanitizeHtmlOptions = {
    allowedTags: sanitizeHtml.defaults.allowedTags.filter(a => ![
        'code'
    ].includes(a)),
    allowedAttributes: {
        '*': ['style'],
        a: ['href', 'class', 'rel', 'target']
    },
    allowedSchemes: ['http', 'https', 'ftp'],
    transformTags: {
        '*': (tagName, attribs) => {
            if(!attribs.style) return { tagName, attribs };

            const style = CSSFilter(attribs.style);

            return {
                tagName,
                attribs: { ...attribs, style }
            }
        },
        a: sanitizeHtml.simpleTransform('a', {
            class: 'wiki-link-external',
            rel: 'nofollow noopener ugc',
            target: '_blank'
        })
    }
}

module.exports = (content, namumark, check = false) => {
    const splittedContent = content.split(' ');
    const firstParam = splittedContent[0];
    const paramContent = splittedContent.slice(1).join(' ');

    if(firstParam.startsWith('#!html') && !namumark.thread) {
        if(check) return content;

        const html = utils.unescapeHtml(content.slice('#!html'.length).trim());
        const safeHtml = sanitizeHtml(html.replaceAll('<newLine/>', ' '), sanitizeHtmlOptions);
        return `${safeHtml}`;
    }

    if(firstParam.startsWith('+')) {
        const size = parseInt(firstParam.slice(1));
        if(!isNaN(size) && size >= 1 && size <= 5)
            return `<span class="wiki-size-up-${size}">${paramContent}</span>`;
    }
    if(firstParam.startsWith('-')) {
        const size = parseInt(firstParam.slice(1));
        if(!isNaN(size) && size >= 1 && size <= 5)
            return `<span class="wiki-size-down-${size}">${paramContent}</span>`;
    }

    if(firstParam.startsWith('#')) {
        const colorParams = firstParam.split(',');

        if(colorParams.length === 1) {
            const slicedFirstParam = firstParam.slice(1);

            if(validateHTMLColorHex(firstParam))
                return `<span style="color: ${firstParam}">${paramContent}</span>`;
            else if(validateHTMLColorName(slicedFirstParam))
                return `<span style="color: ${slicedFirstParam}">${paramContent}</span>`;
        }
        else if(colorParams.length === 2) {
            const slicedColorParams = colorParams.map(colorParam => colorParam.slice(1));

            if(validateHTMLColorHex(colorParams[0]) && validateHTMLColorHex(colorParams[1]))
                return `<span style="color: ${colorParams[0]}" data-dark-style="color: ${colorParams[1]};">${paramContent}</span>`;
            else if(validateHTMLColorName(slicedColorParams[0]) && validateHTMLColorName(slicedColorParams[1]))
                return `<span style="color: ${slicedColorParams[0]}" data-dark-style="color: ${slicedColorParams[1]};">${paramContent}</span>`;
        }
    }
}