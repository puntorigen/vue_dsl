String.prototype.replaceAll = function(strReplace, strWith) {
    // See http://stackoverflow.com/a/3561711/556609
    var esc = strReplace.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    var reg = new RegExp(esc, 'ig');
    return this.replace(reg, strWith);
};

String.prototype.contains = function(test) {
    if (typeof this === 'string' && this.indexOf(test) != -1) {
        return true;
    } else {
        return false;
    }
};

String.prototype.right = function(chars) {
    return this.substr(this.length-chars);
};

export default async function(context) {
    // context.x_state; shareable var scope contents between commands and methods.
    let null_template = {
        hint: 'Allowed node type that must be ommited',
        func: async function(node, state) {
            return context.reply_template({
                hasChildren: false,
                state
            });
        }
    };
    const getTranslatedTextVar = function(text,keep_if_same=false) {
        let vars = context.dsl_parser.findVariables({
            text,
            symbol: `**`,
            symbol_closing: `**`
        });
        //console.log('translated text:'+text,vars);
        let new_vars = context.dsl_parser.replaceVarsSymbol({
            text,
            from: {
                open: `**`,
                close: `**`
            },
            to: {
                open: '${',
                close: '}'
            }
        });
        //console.log('translated new_vars text:'+text,new_vars);
        if ('${' + vars + '}' == new_vars) {
            if (keep_if_same==true) return text;
            return vars;
        } else {
            return `\`${new_vars}\``;
        }
    };
    // process our own attributes_aliases to normalize node attributes
    const aliases2params = function(x_id, node, escape_vars) {
        let params = {
                refx: node.id
            },
            attr_map = {};
        // read x_id attributes aliases
        if ('attributes_aliases' in context.x_commands[x_id]) {
            let aliases = context.x_commands[x_id].attributes_aliases;
            Object.keys(aliases).map(function(key) {
                aliases[key].split(',').map(alternative_key => {
                    attr_map[alternative_key] = key
                });
            });
        }
        // process mapped attributes
        Object.keys(node.attributes).map(function(key) {
            let value = node.attributes[key];
            let key_use = key.trim().replace(':', '');
            let keytest = key_use.toLowerCase();
            let tvalue = value.toString().replaceAll('$variables.', '')
                .replaceAll('$vars.', '')
                .replaceAll('$params.', '')
                .replaceAll('$config.', 'process.env.')
                .replaceAll('$store.', '$store.state.').trim();
            //
            //tvalue = getTranslatedTextVar(tvalue);
            if (keytest == 'props') {
                value.split(' ').map(x => {
                    params[x] = null
                });
            } else if (keytest in attr_map && value != tvalue) {
                // value contains a variable
                if (attr_map[keytest]=='v-model') {
                	params[attr_map[keytest]] = tvalue;
                } else {
                	params[`:${attr_map[keytest]}`] = tvalue;
            	}
            } else if (keytest in attr_map) {
                // literal value
                params[attr_map[keytest]] = tvalue;
            } else {
                // this is an attribute key that is not mapped
                if (value != tvalue || value[0]=="$" || value[0]=="!" ) {
                    if (escape_vars && escape_vars==true) {
                        tvalue = tvalue.replaceAll('{{','').replaceAll('}}','');
                    }
                    params[`:${key_use}`] = tvalue;
                } else {
                    params[key_use] = tvalue;
                }
            }
        });
        //
        return params;
    };
    /*
    //special node names you can define:
    'not_found': {
    	//executed when no there was no matching command for a node.
    	func: async function(node) {
    		return me.reply_template();
    	}
    }

    full node example:
    'def_otro': {
    	x_priority: 'lowest,last,highest,first',
    	x_icons: 'cancel,desktop_new,idea,..',
    	x_not_icons: '',
    	x_not_empty: 'attribute[name]',
    	x_not_text_contains: '',
    	x_empty: '',
    	x_text_exact: '',
    	x_text_contains: '',
    	x_level: '2,>2,<5,..',
    	x_all_hasparent: 'def_padre_otro',
    	x_or_hasparent: '',
    	x_or_isparent: '',
    	x_not_hasparent: '', //@TODO create this meta_attribute in Concepto
    	hint: 'Testing node',
    	autocomplete: {
    		text: 'otro', //activate autocomplete if the node text equals to this
    		icon: 'idea', //activate autocomplete if the node has this icon
    		
    		attributes: {
    			'from': {
    				type: 'int',
    				description: 'If defined, sets the start offset for the node. (example)'
    			}
    		}
    	},
    	func: async function(node,state) {
    		let resp = context.reply_template({ state });
    		return resp;
    	}
    }
    */
    return {
        //'cancel': {...null_template,...{ x_icons:'button_cancel'} },
        'def_config': {...null_template,
            ... {
                x_icons: 'desktop_new',
                x_level: '2',
                x_text_contains: 'config'
            }
        },
        'def_modelos': {...null_template,
            ... {
                x_icons: 'desktop_new',
                x_level: '2',
                x_text_contains: 'modelos'
            }
        },
        'def_assets': {...null_template,
            ... {
                x_icons: 'desktop_new',
                x_level: '2',
                x_text_contains: 'assets'
            }
        },


        // ********************
        //  Express Methods
        // ********************

        'def_server': {
            x_icons: 'desktop_new',
            x_level: '2',
            x_text_contains: 'server|servidor|api',
            hint: 'Representa a un backend integrado con funciones de express.',
            func: async function(node, state) {
                let resp = context.reply_template();
                context.x_state.npm = {...context.x_state.npm,
                    ... {
                        'body_parser': '*',
                        'cookie-parser': '*'
                    }
                };
                context.x_state.central_config.static = false;
                return resp;
            }
        },
        'def_server_path': {
            x_icons: 'list',
            x_level: '3,4',
            x_or_hasparent: 'def_server',
            x_not_icons: 'button_cancel,desktop_new,help',
            hint: 'Carpeta para ubicacion de funcion de servidor',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                //console.log('def_server_path DEBUG',node);
                let test1 = await context.isExactParentID(node.id, 'def_server_path');
                if (node.level == 3) {
                    //state.current_folder = node.text;
                    resp.state.current_folder = node.text;
                } else if (node.level == 4 && test1==true) {
                    let parent_node = await context.dsl_parser.getParentNode({
                        id: node.id
                    });
                    //state.current_folder = `${parent_node.text}/${node.id}`;
                    resp.state.current_folder = `${parent_node.text}/${node.text}`;
                } else {
                    resp.valid = false;
                }
                return resp;
            }
        },
        'def_server_func': { //@TODO finish incomplete
            x_empty: 'icons',
            x_level: '3,4,5',
            x_or_hasparent: 'def_server',
            hint: 'Corresponde a la declaracion de una funcion de servidor',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                context.x_state.central_config.static = false; //server func cannot run in a static site
                resp.state.current_func = node.text;
                if (node.level != 2) {
                    let new_name = resp.state.current_folder?resp.state.current_folder.split('/'):[];
                    resp.state.current_func = [...new_name,node.text].join('_');
                    //console.log('@TODO! def_server_func: new_name',new_name);
                }
                // set function defaults
                if (!context.x_state.functions[resp.state.current_func]) {
                    context.x_state.functions[resp.state.current_func] = {
                        tipo: 'web',
                        acceso: '*',
                        params: '',
                        param_doc: {},
                        doc: node.text_note,
                        method: 'get',
                        return: '',
                        path: '/' + (resp.state.current_folder?resp.state.current_folder+'/':'') + node.text,
                        imports: {}
                    };
                }
                // process attributes
                Object.keys(node.attributes).map(function(keym) {
                    let key = keym.toLowerCase();
                    if ([':type', 'type', 'tipo', ':tipo',':method','method'].includes(key)) {
                        context.x_state.functions[resp.state.current_func].method = node.attributes[key];
                    } else {
                        if (key.contains(':')) {
                            context.x_state.functions[resp.state.current_func].param_doc[key.split(':')[0]] = { type:key.split(':')[1], desc:node.attributes[key] };
                        } else {
                            context.x_state.functions[resp.state.current_func][key.toLowerCase().trim()] = node.attributes[key];
                        }
                    }
                    //
                });
                // write tag code
                resp.open = context.tagParams('func_code', {
                    name: resp.state.current_func,
                    method: context.x_state.functions[resp.state.current_func].method,
                    path: context.x_state.functions[resp.state.current_func].path
                }, false) + '\n';
                resp.close = '</func_code>';
                //
                return resp;
            }
        },

        // *************************
        //  VueX STORES definitions
        // *************************
        'def_store': {
            x_icons: 'desktop_new',
            x_level: '2',
            x_text_contains: 'store',
            hint: 'Representa una coleccion de stores de Vue',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state,
                    hasChildren: true
                });
                return resp;
            }
        },
        'def_store_def': {
            x_empty: 'icons',
            x_level: '3',
            x_all_hasparent: 'def_store',
            hint: 'Representa a una definicion de store de VueX',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                let tmp = {
                    type: 'normal',
                    version: '',
                    expire: ''
                };
                // create store in app state if not already there
                resp.state.current_store = node.text;
                if (!context.x_state.stores) context.x_state.stores = {};
                if (context.x_state.stores && node.text in context.x_state.stores === false) context.x_state.stores[node.text] = {};
                Object.keys(node.attributes).map(function(keym) {
                    let key = keym.toLowerCase();
                    if ([':type', 'type', 'tipo', ':tipo'].includes(key)) {
                        // store type value
                        if (['sesion', 'session'].includes(node.attributes[key])) {
                            tmp.type = 'session';
                            context.x_state.npm['nuxt-vuex-localstorage'] = '*'; // add npm to app package
                        } else if (['local', 'persistent', 'persistente', 'localstorage', 'storage', 'db', 'bd'].includes(node.attributes[key])) {
                            tmp.type = 'local';
                            context.x_state.npm['nuxt-vuex-localstorage'] = '*';
                        }

                    } else if (['version', ':version'].includes(key)) {
                        tmp.version = node.attributes[key];

                    } else if (['expire', ':expire', 'expira', ':expira'].includes(key)) {
                        tmp.expire = node.attributes[key];
                    }
                    //
                });
                // set store type, version and expire attributes for app state
                //if (!context.x_state.stores_types) context.x_state.stores_types={ versions:{}, expires:{} };
                // prepare stores_type, and keys local or session. 
                if (context.x_state.stores_types && tmp.type in context.x_state.stores_types === false) context.x_state.stores_types[tmp.type] = {};
                if (resp.state.current_store in context.x_state.stores_types[tmp.type] === false) context.x_state.stores_types[tmp.type][resp.state.current_store] = {};
                // set version value
                if (tmp.version != '') {
                    if (resp.state.current_store in context.x_state.stores_types['versions'] === false) context.x_state.stores_types['versions'][resp.state.current_store] = tmp.version;
                }
                // set expire value
                if (tmp.expire != '') {
                    if (resp.state.current_store in context.x_state.stores_types['expires'] === false) context.x_state.stores_types['expires'][resp.state.current_store] = tmp.expire;
                }
                // return
                return resp;
            }
        },

        'def_store_field': {
            x_empty: 'icons',
            x_level: '>3',
            x_all_hasparent: 'def_store_def',
            hint: 'Representa al campo de un store de VueX',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                let tmp = { type:'string', default:'', text:node.text.trim() };
                if (node.text.indexOf(':')!=-1) {
                    tmp.type = tmp.text.split(':').slice(-1)[0];
                    tmp.text = tmp.text.split(':')[0];
                }
                // parse attributes
                Object.keys(node.attributes).map(function(keym) {
                    let key = keym.toLowerCase();
                    if ([':def,:default,valor,value'].includes(key)) {
                        tmp.default =node.attributes[keym].toLowerCase();
                    } else if ([':tipo,:type,tipo,type'].includes(key)) {
                        tmp.type =node.attributes[keym].toLowerCase();
                    }
                });
                // set
                if (resp.state.current_store in context.x_state.stores) {
                    context.x_state.stores[resp.state.current_store][tmp.text.trim()] = {default:tmp.default,type:tmp.type};
                } else {
                    context.x_state.stores[resp.state.current_store] = {};
                    context.x_state.stores[resp.state.current_store][tmp.text.trim()] = {default:tmp.default,type:tmp.type};
                }
                // return
                return resp;
            }
        },

        'def_store_mutation': {
            x_level: '>3',
            x_icons: 'help',
            x_all_hasparent: 'def_store',
            attributes_aliases: {
                'params': ':params,params'
            },
            hint: 'Representa la modificacion de un store de VueX',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state,
                    hasChildren: true
                });
                let params = aliases2params('def_store_mutation',node);
                resp.state.current_store_mutation = node.text.trim();
                let cur_store = context.x_state.stores[resp.state.current_store];
                if (!(':mutations' in cur_store)) {
                    context.x_state.stores[resp.state.current_store][':mutations']={};
                }
                context.x_state.stores[resp.state.current_store][':mutations'][resp.state.current_store_mutation] = params;
                resp.open = context.tagParams('store_mutation', {
                    store: resp.state.current_store,
                    mutation: resp.state.current_store_mutation,
                    ...params
                }, false) + '\n';
                resp.close = '</store_mutation>';
                return resp;
            }
        },

        'def_store_modificar': {
            x_level: '>4',
            x_icons: 'desktop_new',
            x_all_hasparent: 'def_store_mutation',
            x_text_contains: 'modificar',
            hint: 'Comando para modificar los valores del state del store padre',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state,
                    hasChildren: true
                });
                let safe = require('safe-eval');
                // parse attributes
                Object.keys(node.attributes).map(function(keym) {
                    let key = keym.trim();
                    let value = node.attributes[keym];
                    let tmp = { val:'' };
                    if (value=='{now}') {
                        resp.open += `state.${key} = new Date()\n`;
                    } else if (value=='') {
                        let val = '';
                        if (key in context.x_state.stores[state.current_store]) {
                            val = context.x_state.stores[state.current_store][key].default;
                        }
                        if (val=='') val=`''`;
                        resp.open += `state.${key} = ${val}\n`;
                    } else if (value.contains('**')) {
                        // preprocess value               
                        let val = value.trim();
                        if (node.icons.includes('bell')) {
                            val = getTranslatedTextVar(value);
                        }
                        if (val=='') val=`''`;
                        if (val.contains('this.') || val.contains('params.')) {
                            val = val.replaceAll('this.','').replaceAll('params.','');
                            resp.open += `state.${key} = objeto.${val}\n`;
                        } else {
                            resp.open += `state.${key} = ${val}\n`;
                        }
                    } else if (value.contains('!')==false && safe(value)!==''+value) {
                        // if val is string
                        resp.open += `state.${key} = ${value}\n`;
                    } else {
                        //if val is not a string
                        if (value!='' && value.charAt(0)=='!' && value.contains('.')==false) {
                            resp.open += `state.${key} = !state.${key}\n`;
                        } else if (value!='' && value.charAt(0)=='!') {
                            // @TODO name = !store.name
                        }
                    }
                });
                return resp;
            }
        },

        'def_store_call': {
            x_level: '>1',
            x_icons: 'desktop_new',
            x_text_contains: 'store:',
            x_or_hasparent: 'def_event_element,def_event_method,def_event_server,def_condicion,def_otra_condicion,def_event_mounted',
            hint: 'Representa al llamdo de un evento de un store',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state,
                    hasChildren: true
                });
                let store = node.text.split(' ')[0].replaceAll('store:','').trim();
                let params = {};
                //let isProxySon = (context.hasParentID(node.id, 'def_proxy_def')==true)?true:false;
                let isProxySon = ('current_proxy' in resp.state)?true:false;
                let method = context.dsl_parser.findVariables({
                    text: node.text,
                    symbol: '"',
                    symbol_closing: '"'
                }).trim();
                Object.keys(node.attributes).map(function(keym) {
                    let key = keym.trim();
                    let value = node.attributes[keym];
                    value = value.replaceAll('$variables.','this.')
                                 .replaceAll('$vars.','$this.')
                                 .replaceAll('$params.','this.')
                                 .replaceAll('$env.','process.env.');
                    if (value.contains('$store.')) {
                        if (isProxySon==true) {
                            value = value.replaceAll('$store.','store.state.');
                        } else {
                            value = value.replaceAll('$store.','this.$store.state.');
                        }
                    }
                    params[key] = value;
                });
                //let util = require('util');
                let data = context.jsDump(params).replaceAll("'`","`").replaceAll("`'","`");
                resp.open = ((isProxySon==true)?'store.':'this.$store.')+`commit('${store}/${method}', ${data});`;
                
                return resp;
            }
        },
        //*def_store_mutation
        //*def_store_field
        //*def_store_modificar
        //*def_store_call

        // **************************
        //  VueX PROXIES definitions
        // **************************
        'def_proxies': {
            x_icons: 'desktop_new',
            x_level: 2,
            x_text_contains: 'prox',
            hint: 'Representa una coleccion de proxies de Vue',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                return resp;
            }
        },
        'def_proxy_def': {
            x_level: 3,
            x_empty: 'icons',
            x_or_isparent: 'def_proxies',
            hint: 'Representa una definicion de un proxy (middleware) en Vue',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                resp.state.current_proxy = node.text.trim();
                context.x_state.proxies[resp.state.current_proxy] = {
                    imports: {
                        underscore: '_'
                    },
                    code: ''
                };
                resp.open = context.tagParams('proxy_code', {
                    name: resp.state.current_proxy
                }, false) + '\n';
                resp.close = '</proxy_code>';
                return resp;
            }
        },

        // *****************************
        //  Vue Pages and View Elements
        // *****************************

        //def_html y otros
        //*def_page
        //*def_page_seo
        //*def_page_estilos
        //*def_page_estilos_class

        'def_page': {
            x_level: 2,
            x_not_icons: 'button_cancel,desktop_new,list,help',
            x_not_text_contains: 'componente:,layout:',
            hint: 'Archivo vue',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                resp.state.current_page = node.text;
                // set global page defaults for current page
                if (!context.x_state.pages[resp.state.current_page]) {
                    context.x_state.pages[resp.state.current_page] = {
                        tipo: 'page',
                        acceso: '*',
                        params: '',
                        layout: '',
                        defaults: {},
                        imports: {},
                        components: {},
                        directives: {},
                        variables: {},
                        seo: {},
                        meta: {},
                        head: {
                            script: [],
                            meta: [],
                            seo: {}
                        },
                        var_types: {},
                        proxies: '',
                        return: '',
                        styles: {},
                        script: {},
                        mixins: {},
                        track_events: {},
                        path: '/' + resp.state.current_page
                    };
                }
                if (resp.state.from_def_layout) context.x_state.pages[resp.state.current_page].tipo = 'layout';
                if (resp.state.from_def_componente) context.x_state.pages[resp.state.current_page].tipo = 'componente';
                // is this a 'home' page ?
                if (node.icons.includes('gohome')) context.x_state.pages[resp.state.current_page].path = '/';
                // attributes overwrite anything
                let params = {};
                Object.keys(node.attributes).map(function(key) {
                    let value = node.attributes[key];
                    // preprocess value
                    value = value.replaceAll('$variables.', '')
                        .replaceAll('$vars.', '')
                        .replaceAll('$params.', '')
                        .replaceAll('$config.', 'process.env')
                        .replaceAll('$store.', '$store.state.');
                    // query attributes
                    if (['proxy'].includes(key.toLowerCase())) {
                        context.x_state.pages[resp.state.current_page].proxies = value;

                    } else if (['acceso', 'method'].includes(key.toLowerCase())) {
                        context.x_state.pages[resp.state.current_page].acceso = value;

                    } else if (['path', 'url', 'ruta'].includes(key.toLowerCase())) {
                        context.x_state.pages[resp.state.current_page].path = value;

                    } else if (['layout'].includes(key.toLowerCase())) {
                        context.x_state.pages[resp.state.current_page].layout = value;

                    } else if (['meta:title', 'meta:titulo'].includes(key.toLowerCase())) {
                        context.x_state.pages[resp.state.current_page].xtitle = value;

                    } else if (['background', 'fondo'].includes(key.toLowerCase())) {
                        params.id = 'tapa';
                        let background = context.getAsset(value, 'css');
                        context.x_state.pages[resp.state.current_page].styles['#tapa'] = {
                            'background-image': `url('${background}')`,
                            'background-repeat': 'no-repeat',
                            'background-size': '100vw'
                        };

                    } else {
                        if (key.charAt(0) != ':' && value != node.attributes[key]) {
                            params[':' + key] = value;
                        } else {
                            params[key] = value;
                        }
                        //context.x_state.pages[resp.state.current_page].xtitle = value;
                        
                    }
                    if (resp.state.from_def_layout || resp.state.from_def_componente) {
                        if (key=='params') {
                            context.x_state.pages[resp.state.current_page].params=value;
                        } else if (key.contains('params:') || key.contains('param:')) {
                            let tmpo = key.replaceAll('params:','').replaceAll('param:','').trim();
                            context.x_state.pages[resp.state.current_page].defaults[tmpo] = value;
                        }
                        //console.log('PABLO COMPONENTE!! o LAYOUT!!',{ key, value });
                    }
                }.bind(this));
                // has comments ?
                if (node.text_note != '') {
                    resp.open = `<!-- ${node.text_note.replaceAll('<br/ >','\n')} -->\n`;
                }
                // set code
                resp.open += `<template>\n`;
                if ('from_def_componente' in resp.state === false) {
                    if (context.x_state.pages[resp.state.current_page]['layout'] == '') {
                        resp.open += '\t' + context.tagParams('v-app', params, false) + '\n';
                        resp.close += '\t</v-app>\n';
                    }
                }
                resp.close += `</template>\n`;
                // return
                return resp;
            }
        },
        'def_page_seo': {
            x_level: 3,
            x_icons: 'desktop_new',
            x_text_contains: 'seo',
            hint: 'Definicion local de SEO',
            func: async function(node, state) {
                // @TODO check this node runs correctly (currently without testing map aug-20-20)
                let resp = context.reply_template({
                    state
                });
                // process children nodes
                let subnodes = await node.getNodes();
                subnodes.map(async function(item) {
                    let test = item.text.toLowerCase().trim();
                    let key_nodes = await item.getNodes();
                    // test by subnode names.
                    if (test == 'keywords') {
                        // get an array of childrens node text
                        let keys = [];
                        key_nodes.map(x => {
                            keys.push(x.text)
                        });
                        // set into current_page state
                        context.x_state.pages[state.current_page].seo[test] = keys;
                        context.x_state.pages[state.current_page].meta.push({
                            hid: context.hash(key_nodes),
                            name: 'keywords',
                            content: keys.join(',')
                        });

                    } else if (test == 'language' && key_nodes.length > 0) {
                        //@TODO check this meta statement output format, because its not clear how it's supposed to work aug-20-20
                        context.x_state.pages[state.current_page].seo[test] = key_nodes[0].text;
                        context.x_state.pages[state.current_page].meta.push({
                            hid: context.hash(key_nodes),
                            lang: key_nodes[0].text.toLowerCase().trim(),
                            content: key_nodes[0].text
                        });

                    } else if (key_nodes.length > 0) {
                        context.x_state.pages[state.current_page].seo[test] = key_nodes[0].text;
                        if (test.contains(':')) {
                            context.x_state.pages[state.current_page].meta.push({
                                property: test,
                                vmid: test,
                                content: key_nodes[0].text
                            });
                        } else {
                            context.x_state.pages[state.current_page].meta.push({
                                hid: context.hash(key_nodes),
                                name: item.text.trim(),
                                content: key_nodes[0].text
                            });
                        }

                    }
                }.bind(this));
                // return
                return resp;
            }
        },
        'def_page_estilos': {
            x_level: '3,4',
            x_icons: 'desktop_new',
            x_text_contains: 'estilos',
            x_or_hasparent: 'def_page,def_componente,def_layout',
            hint: 'Definicion de estilos/clases locales',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                let params = {...{scoped:true}, ... aliases2params('def_page_estilos', node)};
                resp.open = context.tagParams('page_estilos', params, false);
                resp.close = '</page_estilos>';
                return resp;
            }
        },
        'def_page_estilos_class': {
            x_level: 4,
            x_empty: 'icons',
            x_all_hasparent: 'def_page_estilos',
            hint: 'Definicion de clase CSS en template VUE',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                let left_char = node.text.trim().charAt(0);
                if (['#', '.', '|'].includes(left_char) === false) {
                    resp.open = `.${node.text.trim()} {\n`;
                } else if (left_char == '|') {
                    resp.open = `${node.text.trim().substring(1)} {\n`; //removed | from start.
                } else {
                    resp.open = `${node.text.trim()} {\n`;
                }
                // output attributes
                // @TODO improve this; I believe this could behave more like def_variables_field instead, and so support nested styles.
                // currently this works as it was in the CFC
                Object.keys(node.attributes).map(function(key) {
                    let value = node.attributes[key];
                    if (context.x_state.es6 && !value.contains('!important') && value.slice(-1)!=';') {
                        resp.open += `\t${key}: ${value} !important;\n`;    
                    } else if (context.x_state.es6 && !value.contains('!important')) {
                        resp.open += `\t${key}: ${value.slice(0,-1)} !important;\n`;
                    } else {
                        resp.open += `\t${key}: ${value};\n`;
                    }
                });
                resp.open += '}\n';
                return resp;
            }
        },

        //*def_layout
        //*def_layout_view
        //*def_layout_contenido (ex. def_contenido_layout)
        //*def_componente
        //*def_componente_view (instancia)
        //*def_componente_emitir (ex: def_llamar_evento, script)

        'def_layout': {
            x_level: 2,
            x_not_icons: 'button_cancel,desktop_new,list,help,idea',
            x_text_contains: 'layout:',
            x_empty: 'icons',
            hint: 'Archivo vue tipo layout',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                // call def_page for functionality informing we are calling from def_layout using state.
                resp = await context.x_commands['def_page'].func(node, {...state,
                    ... {
                        from_def_layout: true
                    }
                });
                delete resp.state.from_def_layout;
                return resp;
            }
        },
        'def_layout_view': {
            x_level: '>2',
            x_icons: 'idea',
            x_text_contains: 'layout:',
            hint: 'Contenedor flexible, layout:flex o layout:wrap',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                let tmp = {
                    tipo: 'flex',
                    width: 6
                };
                if (node.text_note != '') resp.open = `<!-- ${node.text_note.trim()} -->`;
                if (node.text.contains(':wrap')) tmp.tipo = 'wrap';
                let params = aliases2params('def_layout_view', node);
                tmp.params = {...params
                };
                // special cases
                if (params.width) {
                    tmp.width = params.width;
                    if (params.width.contains('%')) {
                        tmp.width = Math.round((parseInt(params.width.replaceAll('%', '')) * 12) / 100);
                    }
                    delete params.width;
                }
                if (params[':width']) delete params[':width'];
                // write output
                if (tmp.params.margen && tmp.params.margen == 'true') {
                    delete params.margen;
                    if (tmp.params.center && tmp.params.center == 'true') {
                        //resp.open += `<v-container fill-height='xpropx'>\n`;
                        resp.open += context.tagParams('v-container', { 'fill-height':null }, false) + '\n';
                        resp.open += context.tagParams('v-row', { 'align-center':null }, false) + '\n';
                    } else {
                        if (tmp.tipo == 'flex') {
                            resp.open += `<v-container>\n`;
                            params.row = null;
                            resp.open += context.tagParams('v-layout', params, false) + '\n';
                        } else if (tmp.tipo == 'wrap') {
                            resp.open += context.tagParams('v-container', { 'fill-height':null, 'container--fluid':null, 'grid-list-xl':null }, false) + '\n';
                            params.wrap = null;
                            resp.open += context.tagParams('v-layout', params, false) + '\n';
                        }
                    }
                    // part flex
                    if (tmp.tipo == 'flex' && tmp.params.center && tmp.params.center == 'true') {
                        params['xs12'] = null;
                        params['sm' + tmp.width] = null;
                        params['offset-sm' + Math.round(tmp.width / 2)] = null;
                        resp.open += context.tagParams('v-flex', params, false) + '\n';
                        resp.close += `</v-flex>`;
                    }
                    // close layout
                    if (context.x_state.es6 && tmp.params.center && tmp.params.center == 'true') {
                        resp.close += '</v-row>\n';
                    } else {
                        resp.close += '</v-layout>\n';
                    }
                    resp.close += '</v-container>\n';
                } else {
                    // without margen
                    if (tmp.params.center && tmp.params.center == 'true') {
                        delete params.center;
                        if (context.x_state.es6) {
                            params = {...params, ...{ wrap:null, 'align-center':null }};
                            resp.open += context.tagParams('v-row', params, false) + '\n';
                        } else {
                            params = {...params, ...{ row:null, wrap:null, 'align-center':null }};
                            resp.open += context.tagParams('v-layout', params, false) + '\n';
                        }
                    } else {
                        resp.open += context.tagParams('v-layout', { wrap:null }, false)+'\n';
                    }
                    // part flex
                    if (tmp.tipo == 'flex' && tmp.params.center && tmp.params.center == 'true') {
                        delete params.center;
                        params['xs12'] = null;
                        params['sm' + tmp.width] = null;
                        params['offset-sm' + Math.round(tmp.width / 2)] = null;
                        resp.open += context.tagParams('v-flex', params, false) + '\n';
                        resp.close += `</v-flex>`;
                    }
                    // close layout
                    if (context.x_state.es6 && tmp.params.center && tmp.params.center == 'true') {
                        resp.close += '</v-row>';
                    } else {
                        resp.close += '</v-layout>';
                    }
                }
                // return
                return resp;
            }
        },
        'def_layout_contenido': {
            x_level: 3,
            x_icons: 'idea',
            x_text_contains: 'contenido',
            x_all_hasparent: 'def_layout',
            hint: 'Placeholder para contenidos de paginas en pantallas tipo layouts',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                let params = {};
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                if (context.x_state.central_config['keep-alive']) params['keep-alive'] = null;
                // write tag
                resp.open += context.tagParams('nuxt', params, true) + `\n`;
                return resp;
            }
        },

        'def_componente': {
            x_level: 2,
            x_not_icons: 'button_cancel,desktop_new,list,help,idea',
            x_text_contains: 'componente:',
            x_empty: 'icons',
            hint: 'Archivo vue tipo componente',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                // call def_page for functionality informing we are calling from def_componente using state.
                resp = await context.x_commands['def_page'].func(node, {...state,
                    ... {
                        from_def_componente: true
                    }
                });
                delete resp.state.from_def_componente;
                return resp;
            }
        },
        'def_componente_view': {
            x_level: '>2',
            x_icons: 'idea',
            x_text_contains: 'componente:',
            hint: 'Instancia de componente',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                // prepare vars
                let file_name = node.text.trim().split(':').pop();
                let tag_name = `c-${file_name}`;
                let var_name = file_name.replaceAll('-', '');
                // add import to page
                context.x_state.pages[state.current_page].imports[`~/components/${file_name}.vue`] = var_name;
                context.x_state.pages[state.current_page].components[tag_name] = var_name;
                // process attributes and write output
                let params = aliases2params('def_componente_view', node);
                if (node.text_note != '') resp.open = `<!-- ${node.text_note.trim()} -->\n`;
                resp.open += context.tagParams(tag_name, params, false) + '\n';
                resp.close = `</${tag_name}>\n`;
                resp.state.from_componente=true;
                return resp;
            }
        },
        'def_componente_emitir': {
            //@oldname: def_llamar_evento
            x_level: '>2',
            x_icons: 'desktop_new',
            x_text_contains: 'llamar evento|emitir evento',
            //@idea x_text_contains: `llamar evento "{evento}"|emitir evento "{evento}"`,
            x_all_hasparent: 'def_componente',
            hint: 'Emite un evento desde el componente a sus instancias',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                let event_name = context.dsl_parser.findVariables({
                    text: node.text,
                    symbol: '"',
                    symbol_closing: '"'
                }).trim();
                // pass attributes as data to parent of component
                let params = [];
                Object.keys(node.attributes).map(function(key) {
                    let value = node.attributes[key];
                    // preprocess value
                    if (value.contains('**') && node.icons.includes('bell')) {
                        value = getTranslatedTextVar(value);
                    } else if (value == 'true' || value == 'false') {
                        value = (value == 'true') ? true : value;
                        value = (value == 'false') ? false : value;
                    } else if (value.contains('$')) {
                        value = value.replaceAll('$variables.', 'this.')
                            .replaceAll('$vars.', 'this.')
                            .replaceAll('$params.', 'this.')
                            .replaceAll('$config.', 'process.env')
                            .replaceAll('$store.', 'this.$store.state.');
                    } else if (value.contains('this.') == false) {
                        //@TODO add i18n support here
                        if (value.contains(`'`) == false) {
                            value = `'${value}'`;
                        }
                    }
                    params.push(`${key}: ${value}`);
                });
                // write output and return
                if (node.text_note != '') resp.open = `// ${node.text_note.trim()}\n`;
                resp.open += `this.$emit('${event_name}',{${params.join(',')}});\n`;
                return resp;
            }
        },

        // CARDs

        'def_card': {
            x_level: '>2',
            x_icons: 'idea',
            x_text_contains: 'card',
            x_not_text_contains: ':text,:texto,:title,:action,:image,:media',
            attributes_aliases: {
                'width': 'width,ancho',
                'height': 'height,alto'
            },
            hint: 'Card de vuetify',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_card', node);
                // write tag
                resp.open += context.tagParams('v-card', params, false) + '\n';
                resp.close += `</v-card>\n`;
                return resp;
            }
        },
        'def_card_title': {
            x_level: '>3',
            x_icons: 'idea',
            x_text_contains: 'card:title',
            x_all_hasparent: 'def_card',
            hint: 'Titulo de card de vuetify',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_card_title', node);
                resp.open += context.tagParams('v-card-title', params, false) + '\n';
                resp.close += `</v-card-title>\n`;
                return resp;
            }
        },
        'def_card_text': {
            x_level: '>3',
            x_icons: 'idea',
            x_text_contains: 'card:text',
            x_all_hasparent: 'def_card',
            hint: 'Contenido de card de vuetify',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_card_text', node);
                resp.open += context.tagParams('v-card-text', params, false) + '\n';
                resp.close += `</v-card-text>\n`;
                return resp;
            }
        },
        'def_card_actions': {
            x_level: '>3',
            x_icons: 'idea',
            x_text_contains: 'card:action',
            x_all_hasparent: 'def_card',
            hint: 'Acciones de card de vuetify',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_card_actions', node);
                resp.open += context.tagParams('v-card-actions', params, false) + '\n';
                resp.close += `</v-card-actions>\n`;
                return resp;
            }
        },
        'def_card_media': {
            x_level: '>3',
            x_icons: 'idea',
            x_text_contains: 'card:media',
            x_all_hasparent: 'def_card',
            hint: 'Contenido multimedia para card de vuetify',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_card_media', node);
                if (context.x_state.es6) {
                    resp.open += context.tagParams('v-img', params, false) + '\n';
                    resp.close += `</v-img>\n`;
                } else {
                    resp.open += context.tagParams('v-card-media', params, false) + '\n';
                    resp.close += `</v-card-media>\n`;
                }
                return resp;
            }
        },

        //*def_card
        //*def_card_title
        //*def_card_text
        //*def_card_actions
        //*def_card_media

        // FORMs
        'def_form': {
            x_level: '>2',
            x_icons: 'idea',
            x_text_contains: 'form',
            attributes_aliases: {
                'v-model': 'valid,value'
            },
            hint: 'Formulario de vuetify',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_form', node);
                resp.open += context.tagParams('v-form', params, false) + '\n';
                resp.close += `</v-form>\n`;
                return resp;
            }
        },
        'def_form_field': {
            x_level: '>2',
            x_icons: 'pencil',
            x_not_icons: 'calendar,clock,attach,freemind_butterfly',
            x_not_text_contains: 'google:',
            attributes_aliases: {
                'placeholder': 'hint,ayuda',
                'mark': 'mask,mascara,formato',
                'prepend-icon': 'pre:icon',
                'append-icon': 'post:icon',
                'type': 'type,tipo',
                'value': 'value,valor',
                'counter': 'counter,maxlen,maxlength,max'
            },
            hint: 'Campo de entrada (text,textarea,checkbox,radio,combo,select,switch,toogle,autocomplete) para usar en formulario vuetify',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                let tmp = {};
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_form_field', node);
                tmp = {... {
                        type: 'text'
                    },
                    ...params
                };
                params['refx'] = node.id;
                // add v-model as node.text
                if (node.text.contains('$')) {
                    let vmodel = node.text.trim().split(',').pop();
                    vmodel = vmodel.replaceAll('$variables.', '')
                        .replaceAll('$vars.', '')
                        .replaceAll('$params.', '')
                        .replaceAll('$store', '$store.state.');
                    params['v-model'] = vmodel;
                } else {
                    params['v-model'] = node.text.trim();
                }
                // render by type
                delete params.type;
                if (tmp.type == 'combo') {
                    resp.open += context.tagParams('v-combobox', params, false) + '\n';
                    resp.close += `</v-combobox>\n`;
                } else if (tmp.type == 'toogle') {
                    resp.open += context.tagParams('v-btn-toogle', params, false) + '\n';
                    resp.close += `</v-btn-toogle>\n`;
                } else if ('textarea,checkbox,radio,switch'.split(',').includes(tmp.type)) {
                    resp.open += context.tagParams(`v-${tmp.type}`, params, false) + '\n';
                    resp.close += `</v-${tmp.type}>\n`;
                } else if ('autocomplete,autocompletar,auto,select'.split(',').includes(tmp.type)) {
                    // item-text
                    if ('item-text' in params && params['item-text'].contains('{{')) {
                        // suppport for values like '{{ name }} - ({{ tracks.total }})'
                        let new_val = params['item-text'];
                        let vars = context.dsl_parser.findVariables({
                            text: params['item-text'],
                            symbol: '{{',
                            symbol_closing: '}}',
                            array: true
                        });
                        // replace {{ x }} with {{ item.x }}
                        vars.map(old => {
                            new_val.replaceAll(old, `item.${old.trim()}`);
                        });
                        // if starts with "{{ ", remove
                        if (new_val.slice(0, 3) == '{{ ') new_val = new_val.slice(3);
                        // if ends with " }}", remove
                        if (new_val.slice(-3) == ' }}') {
                            new_val = new_val.slice(0, -3);
                        } else {
                            // add quote at the end
                            new_val += `'`;
                        }
                        // replace " }}" with "+'" and replace "{{ " with "'+"
                        new_val = new_val.replaceAll(' }}', `+'`).replaceAll('{{ ', `'+`);
                        // ready
                        params[':item-text'] = `(item)=>${new_val}`;
                        delete params['item-text'];

                    } else if ('item-text' in params && params['item-text'].contains(' ')) {
                        let new_val = [];
                        params['item-text'].split(' ').map(nv => {
                            new_val.push(`item.${nv}`);
                        });
                        params[':item-text'] = '(item)=>' + new_val.join(`+' '+`);
                        delete params['item-text'];
                    }
                    // item-value
                    if ('item-value' in params && params['item-value'].contains(' ')) {
                        let new_val = [];
                        params['item-value'].split(' ').map(nv => {
                            new_val.push(`item.${nv}`);
                        });
                        params[':item-value'] = '(item)=>' + new_val.join(`+' '+`);
                        delete params['item-value'];
                    }
                    //
                    if ('autocomplete,autocompletar,auto'.split(',').includes(tmp.type)) {
                        resp.open += context.tagParams('v-autocomplete', params, false) + '\n';
                        resp.close += `</v-autocomplete>\n`;
                    } else if (tmp.type == 'select') {
                        if ('item-value' in params === false &&
                            'return-object' in params === false && ':return-object' in params === false) {
                            params[':return-object'] = true;
                        }
                        resp.open += context.tagParams('v-select', params, false) + '\n';
                        resp.close += '</v-select>\n';
                    }
                } else {
                    // text type or any other type
                    if (tmp[':mask']) {
                        tmp['v-mask'] = tmp[':mask'];
                        delete tmp[':mask'];
                    } else if (tmp['mask']) {
                        tmp['v-mask'] = `'${tmp['mask']}'`;
                        delete tmp['mask'];
                    }
                    resp.open += context.tagParams('v-text-field', tmp, false) + '\n';
                    resp.close += `</v-text-field>\n`;
                }
                //event friendly name
                if (params.label) resp.state.friendly_name = params.label;
                // return
                return resp;
            }
        },
        'def_form_field_image': {
            x_level: '>2',
            x_icons: 'pencil,attach',
            x_not_icons: 'calendar,clock,freemind_butterfly',
            x_not_text_contains: 'google:',
            hint: 'Campo de entrada de imagen (subir imagen) para usar en formulario vuetify',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_form_field', node);
                params['refx'] = node.id;
                // add node.text (var) as image prefill
                if (node.text.trim() != '-') {
                    if (node.text.contains('$')) {
                        let vmodel = node.text.trim().split(',').pop();
                        vmodel = vmodel.replaceAll('$variables.', '')
                            .replaceAll('$vars.', '')
                            .replaceAll('$params.', '')
                            .replaceAll('$store', '$store.state.');
                        params[':prefill'] = vmodel;
                    } else {
                        params['prefill'] = node.text.trim();
                    }
                }
                // image defaults
                params[':removable'] = false;
                params[':hideChangeButton'] = true;
                // add plugin
                context.x_state.plugins['vue-picture-input'] = {
                    global: true,
                    npm: {
                        'vue-picture-input': '*'
                    },
                    tag: 'picture-input'
                };
                if (params.type) delete params.type;
                // write output
                resp.open += context.tagParams('picture-input', params, false) + '\n';
                resp.close = `</picture-input>\n`;
                return resp;
            }
        },
        'def_form_field_galery': {
            x_level: '>2',
            x_icons: 'pencil,freemind_butterfly',
            x_not_icons: 'calendar,clock,attach',
            x_not_text_contains: 'google:',
            hint: 'Campo de entrada de galeria de imagenes (elegir una o varias imagenes) para usar en formulario vuetify',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_form_field_galery', node);
                params['refx'] = node.id;
                // add node.text (var) as image prefill
                if (node.text.trim() != '') {
                    let vmodel = node.text.trim();
                    if (node.text.contains('$')) {
                        vmodel = vmodel.split(',').pop();
                        vmodel = vmodel.replaceAll('$variables.', '')
                            .replaceAll('$vars.', '')
                            .replaceAll('$params.', '')
                            .replaceAll('$store', '$store.state.');
                    }
                    params['@onselectimage'] = `(item)=>${vmodel}=[item]`;
                    params['@onselectmultipleimage'] = `(item)=>${vmodel}=item`;
                    params[':selectedImages'] = vmodel;
                }
                // add plugin
                context.x_state.plugins['vue-select-image'] = {
                    global: true,
                    npm: {
                        'vue-select-image': '*'
                    },
                    tag: 'vue-select-image',
                    requires: ['vue-select-image/dist/vue-select-image.css']
                };
                if (params.type) delete params.type;
                // write output
                resp.open += context.tagParams('vue-select-image', params, false) + '\n';
                resp.close = `</vue-select-image>\n`;
                return resp;
            }
        },
        'def_form_field_date': {
            x_level: '>2',
            x_icons: 'pencil,calendar',
            x_not_icons: 'clock,attach,freemind_butterfly',
            x_not_text_contains: 'google:',
            hint: 'Campo de entrada con selector de fecha (sin hora) para usar en formulario vuetify',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_form_field_date', node);
                if (node.text.trim() != '') {
                    let vmodel = node.text.trim();
                    if (node.text.contains('$')) {
                        vmodel = vmodel.split(',').pop();
                        vmodel = vmodel.replaceAll('$variables.', '')
                            .replaceAll('$vars.', '')
                            .replaceAll('$params.', '')
                            .replaceAll('$store', '$store.state.');
                    }
                    params['v-model'] = vmodel;
                }
                // add plugin
                context.x_state.npm['luxon'] = '*'; // for i18n support
                context.x_state.plugins['vue-datetime'] = {
                    global: true,
                    npm: {
                        'vue-datetime': '*'
                    }
                };
                params.type = 'date';
                // write output
                resp.open += context.tagParams('datetime', params, false) + '\n';
                resp.close = `</datetime>\n`;
                return resp;
            }
        },
        'def_form_field_datetime': {
            x_level: '>2',
            x_icons: 'pencil,calendar,clock',
            x_not_icons: 'attach,freemind_butterfly',
            x_not_text_contains: 'google:',
            hint: 'Campo de entrada con selector de fecha y hora para usar en formulario vuetify',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_form_field_datetime', node);
                if (node.text.trim() != '') {
                    let vmodel = node.text.trim();
                    if (node.text.contains('$')) {
                        vmodel = vmodel.split(',').pop();
                        vmodel = vmodel.replaceAll('$variables.', '')
                            .replaceAll('$vars.', '')
                            .replaceAll('$params.', '')
                            .replaceAll('$store', '$store.state.');
                    }
                    params['v-model'] = vmodel;
                }
                // add plugin
                context.x_state.plugins['vuetify-datetime-picker'] = {
                    global: true,
                    npm: {
                        'vuetify-datetime-picker': '2.0.3'
                    },
                    styles: [{
                        file: 'dtpicker.styl',
                        lang: 'styl',
                        content: `@require '~vuetify-datetime-picker/src/stylus/main.styl'`
                    }]
                };
                if (params.type) delete params.type;
                // write output
                resp.open += context.tagParams('v-datetime-picker', params, false) + '\n';
                resp.close = `</v-datetime-picker>\n`;
                return resp;
            }
        },
        'def_form_google_autocomplete': {
            x_level: '>2',
            x_icons: 'pencil',
            x_text_contains: 'google:autocomplet',
            attributes_aliases: {
                'apiKey': 'key,llave',
                'language': 'lang,language,lenguaje',
                'id': 'id',
                'placeholder': 'hint,ayuda'
            },
            hint: 'Campo autocompletar para direcciones en formulario vuetify',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                let config = {
                    language: 'es'
                };
                let params = aliases2params('def_form_google_autocomplete', node);
                if (params.apiKey) {
                    config.apiKey = params.apiKey;
                    delete params.apiKey;
                }
                if (params.language) {
                    config.language = params.language;
                    delete params.language;
                }
                context.x_state.plugins['vuetify-google-autocomplete'] = {
                    global: true,
                    npm: {
                        'vuetify-google-autocomplete': '*'
                    },
                    config: JSON.stringify(config)
                };
                // return output
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                resp.open += context.tagParams('vuetify-google-autocomplete', params, false) + '\n';
                resp.close = `</vuetify-google-autocomplete>\n`;
                return resp;
            }
        },
        //*def_form
        //*def_form_field (ex. def_textfield)
        //*def_form_field_image
        //*def_form_field_galery
        //*def_form_field_date
        //*def_form_field_datetime
        //*def_form_google_autocomplete (ex. def_google_autocomplete) - IN @PROGRESS

        'def_margen': {
            x_icons: 'idea',
            x_text_contains: 'margen',
            hint: 'Define un margen alrededor del contenido',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                // parse attributes
                let params = {};
                Object.keys(node.attributes).map(function(key) {
                    let value = node.attributes[key];
                    // preprocess value
                    value = value.replaceAll('$variables.', '')
                        .replaceAll('$vars.', '')
                        .replaceAll('$params.', '')
                        .replaceAll('$config.', 'process.env')
                        .replaceAll('$store.', '$store.state.');
                    // query attributes
                    if (key.toLowerCase() == 'props') {
                        for (let i of value.split(' ')) {
                            params[i] = null;
                        }
                    } else {
                        params[key] = value;
                    }
                });
                //
                resp.open += context.tagParams('v-container', params, false) + '\n';
                resp.close += '</v-container>\n';
                //
                return resp;
            }
        },

        'def_contenedor': {
            x_icons: 'idea',
            x_text_contains: 'contenedor',
            x_level: '>2',
            hint: 'Vue Container',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                let params = {
                    refx: node.id
                };
                // process attributes
                Object.keys(node.attributes).map(function(key) {
                    let value = node.attributes[key];
                    let keytest = key.toLowerCase().trim();
                    let tvalue = value.toString().replaceAll('$variables', '')
                        .replaceAll('$vars.', '')
                        .replaceAll('$params.', '')
                        .replaceAll('$env.', 'process.env.')
                        .replaceAll('$store.', '$store.state.').trim();
                    if (keytest == 'props') {
                        for (let i of tvalue.split(' ')) {
                            params[i] = null;
                        }
                    } else {
                        if (keytest.charAt(0) != ':' && value != '' && value != tvalue) {
                            params[':' + key.trim()] = tvalue;
                        } else {
                            params[key.trim()] = tvalue;
                        }
                    }
                }.bind(this));
                // write response
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->\n`;
                resp.open += context.tagParams('v-container', params, false) + '\n';
                resp.close = '</v-container>\n';
                // return
                return resp;
            }
        },

        'def_flex': {
            x_icons: 'idea',
            x_text_contains: 'flex',
            x_not_text_contains: ':',
            hint: 'Columna de ancho flexible',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                let params = {
                    refx: node.id
                };
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                // process attributes
                Object.keys(node.attributes).map(function(key) {
                    let value = node.attributes[key];
                    let keytest = key.toLowerCase().trim();
                    let tvalue = value.toString().replaceAll('$variables', '')
                        .replaceAll('$vars.', '')
                        .replaceAll('$params.', '')
                        .replaceAll('$env.', 'process.env.')
                        .replaceAll('$store.', '$store.state.').trim();
                    let numsize = 0;
                    if (tvalue.indexOf('%') != -1) {
                        tvalue = parseInt(tvalue.replaceAll('%', '').trim());
                        numsize = Math.round((tvalue * 12) / 100);
                    }
                    // start testing attributes
                    if (keytest == 'class') {
                        params.class = tvalue;
                    } else if (keytest == 'props') {
                        for (let i of tvalue.split(' ')) {
                            params[i] = null;
                        }
                    } else if ('padding,margen'.split(',').includes(keytest)) {
                        params['pa-' + tvalue] = null;
                    } else if (keytest == 'ancho') {
                        params = {...params,
                            ...setObjectKeys(`xs-${numsize},sm-${numsize},md-${numsize},lg-${numsize}`, null)
                        };
                    } else if (keytest == 'offset') {
                        params = {...params,
                            ...setObjectKeys(`offset-xs-${numsize},offset-sm-${numsize},offset-md-${numsize},offset-lg-${numsize}`, null)
                        };
                    } else if ('muy chico,movil,small,mobile'.split(',').includes(keytest)) {
                        params[`xs${numsize}`] = null;
                    } else if ('chico,tablet,small,tableta'.split(',').includes(keytest)) {
                        params[`sm${numsize}`] = null;
                    } else if ('medio,medium,average'.split(',').includes(keytest)) {
                        params[`md${numsize}`] = null;
                    } else if ('grande,pc,desktop,escritorio'.split(',').includes(keytest)) {
                        params[`lg${numsize}`] = null;
                    } else if ('xfila:grande,xfila:pc,xfila:desktop,pc,escritorio,xfila:escritorio'.split(',').includes(keytest)) {
                        params[`lg${Math.round(12/tvalue)}`] = null;
                    } else if ('xfila:medio,xfila:tablet,tablet,xfila'.split(',').includes(keytest)) {
                        params[`md${Math.round(12/tvalue)}`] = null;
                    } else if ('xfila:chico,xfila:movil,xfila:mobile'.split(',').includes(keytest)) {
                        params[`sm${Math.round(12/tvalue)}`] = null;
                    } else if ('xfila:muy chico,xfila:movil chico,xfila:small mobile'.split(',').includes(keytest)) {
                        params[`xs${Math.round(12/tvalue)}`] = null;
                    } else if ('muy chico:offset,movil:offset,small:offset,mobile:offset'.split(',').includes(keytest)) {
                        params[`offset-xs${Math.round(12/tvalue)}`] = null;
                    } else if ('chico:offset,tablet:offset,small:offset,tableta:offset'.split(',').includes(keytest)) {
                        params[`offset-sm${Math.round(12/tvalue)}`] = null;
                    } else if ('medio:offset,medium:offset,average:offset'.split(',').includes(keytest)) {
                        params[`offset-md${Math.round(12/tvalue)}`] = null;
                    } else if ('grande:offset,pc:offset,desktop:offset,escritorio:offset,grande:left'.split(',').includes(keytest)) {
                        params[`offset-lg${Math.round(12/tvalue)}`] = null;
                    } else {
                        if (keytest.charAt(0) != ':' && value != '' && value != tvalue) {
                            params[':' + key.trim()] = tvalue;
                        } else {
                            params[key.trim()] = tvalue;
                        }

                    }
                });
                // write tag
                resp.open += context.tagParams('v-flex', params, false) + '\n';
                resp.close = '</v-flex>\n';
                // return
                return resp;
            }
        },

        'def_spacer': {
            x_icons: 'idea',
            x_text_contains: 'spacer',
            x_level: '>2',
            hint: 'Spacer es un espaciador flexible',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                resp.open += context.tagParams('v-spacer', {}, true) + '\n';
                return resp;
            }
        },

        'def_progress': {
            x_icons: 'idea',
            x_text_contains: 'progres',
            x_level: '>2',
            attributes_aliases: {
                'background-color': 'background-color,background',
                'background-opacity': 'background-opacity,opacity',
                'buffer-value': 'max,max-value',
                'value': 'value,valor',
                'indeterminate': 'loop,infinito',
                'width': 'width,ancho',
                'size': 'size,porte',
                'rotate': 'rotate,rotar'
            },
            hint: 'Item de progreso',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                let tmp = {
                    tipo: 'circular'
                };
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                // process our own attributes_aliases to normalize node attributes
                let params = aliases2params('def_progress', node);
                Object.keys(params).map(function(key) {
                    // take into account special cases
                    if (key.toLowerCase() == 'tipo' && 'lineal,linea,linear'.split(',').includes(params[key])) {
                        tmp.tipo = 'linear';
                        delete params[key];
                    } else if (key.toLowerCase() == 'indeterminate') {
                        params[`:${key}`] = params[key];
                        delete params[key];
                    }
                });
                // write tag
                resp.open += context.tagParams(`v-progress-${tmp.tipo}`, params, false) + '\n';
                resp.close = `</v-progress-${tmp.tipo}>\n`;
                // return
                return resp;
            }
        },

        'def_dialog': {
            x_level: '>2',
            x_icons: 'idea',
            x_text_contains: 'dialog',
            x_not_text_contains: 'boton:',
            attributes_aliases: {
                'width': 'width,ancho',
                'max-width': 'max-width,ancho-max,max-ancho'
            },
            hint: 'Dialogo de vuetify',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_dialog', node);
                // write tag
                resp.open += context.tagParams('v-dialog', params, false) + '\n';
                resp.close += `</v-dialog>\n`;
                return resp;
            }
        },

        'def_center': {
            x_icons: 'idea',
            x_text_contains: 'centrar',
            hint: 'Centra nodos hijos',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                let params = {
                    refx: node.id,
                    class: 'text-xs-center'
                };
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                resp.open = context.tagParams('div', params, false) + '<center>\n';
                resp.close += '</center></div>\n';
                return resp;
            }
        },

        'def_html': {
            x_icons: 'idea',
            x_text_contains: 'html:',
            hint: 'html:x, donde x es cualquier tag',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                let params = aliases2params('def_html', node);
                // parse attributes
                /*
                Object.keys(node.attributes).map(function(key) {
                    let value = node.attributes[key];
                    // preprocess value
                    value = value.replaceAll('$variables.', '')
                        .replaceAll('$vars.', '')
                        .replaceAll('$params.', '')
                        .replaceAll('$config.', 'process.env')
                        .replaceAll('$store.', '$store.state.');
                    // query attributes
                    if (key.toLowerCase() == 'props') {
                        for (let i of value.split(' ')) {
                            params[i] = null;
                        }
                    } else if (key.charAt(0) != ':' && value != node.attributes[key]) {
                        params[':' + key] = value;
                    } else if (key != 'v-model') {
                        if (context.x_state.central_config.idiomas.indexOf(',') != -1) {
                            // value needs i18n keys
                            let def_lang = context.x_state.central_config.idiomas.split(',')[0];
                            if (!context.x_state.strings_i18n[def_lang]) {
                                context.x_state.strings_i18n[def_lang] = {};
                            }
                            let crc32 = 't_' + context.hash(value);
                            context.x_state.strings_i18n[def_lang][crc32] = value;
                            params[':' + key] = `$t('${crc32}')`;
                        } else {
                            params[key] = value;
                        }

                    } else {
                        params[key] = value;
                    }
                }.bind(this));*/
                //
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let tag = node.text.replace('html:', '');
                if (node.nodes_raw && node.nodes_raw.length > 0) {
                    let tmp = await node.getNodes({ recurse:false });
                    let has_only_events = true;
                    for (let x of tmp) {
                        if (x.icons.includes('help')==false) {
                            has_only_events = false;
                            break;
                        }
                    }
                    if (!has_only_events) {
                        // this tag has real children
                        resp.open += context.tagParams(tag, params, false) + '\n';
                        resp.close += `</${tag}>\n`;
                    } else {
                        // has only ghost childs (self-close)
                        resp.open += context.tagParams(tag, params, true)+'\n';                        
                    }
                } else {
                    // doesn't have children nodes (self-close)
                    resp.open += context.tagParams(tag, params, true)+'\n';
                }
                resp.state.friendly_name = tag;
                return resp;
            }
        },
        'def_textonly': {
            x_level: '>2',
            x_empty: 'icons',
            x_priority: -5,
            x_or_hasparent: 'def_page,def_componente,def_layout',
            // @TODO (idea) x_not_hasparent: 'def_toolbar+!def_slot,def_variables,def_page_estilos,def_page_estilos', 
            hint: 'Texto a mostrar',
            func: async function(node, state) {
                let resp = context.reply_template({
                        state
                    }),
                    params = {
                        class: []
                    },
                    tmp = {};
                let text = node.text.replaceAll('$variables.', '')
                    .replaceAll('$vars.', '')
                    .replaceAll('$params.', '')
                    .replaceAll('$config.', 'process.env.')
                    .replaceAll('$store.', '$store.state.');
                if (text == '') text = '&nbsp;';
                // some extra validation
                if (await context.hasParentID(node.id, 'def_toolbar') == true && await context.hasParentID(node.id, 'def_slot') == false) {
                    resp.valid = false;
                } else if (await context.hasParentID(node.id, 'def_datatable_headers') == true) {
                    resp.valid = false;
                } else if (await context.hasParentID(node.id, 'def_variables') == true) {
                    resp.valid = false;
                } else if (await context.hasParentID(node.id, 'def_page_estilos') == true) {
                    resp.valid = false;
                } else if (await context.hasParentID(node.id, 'def_page_estilos') == true) {
                    resp.valid = false;
                } else {
                    if (node.text_note != '') resp.open += `<!-- ${node.text_note} -->\n`;
                    //
                    if (node.text.indexOf('..lorem..') != -1 && node.text.indexOf(':') != -1) {
                        //lorem ipsum text
                        let lorem = node.text.split(':');
                        tmp.lorem = lorem[lorem.length - 1];
                    }
                    if (node.text.indexOf('numeral(') != -1) {
                        //numeral() filter
                        context.x_state.plugins['vue-numeral-filter'] = {
                            global: true,
                            npm: {
                                'vue-numeral-filter': '*'
                            },
                            config: `{ locale: 'es-es' }`
                        };
                    }
                    //node styles
                    if (node.font.bold == true) params.class.push('font-weight-bold');
                    if (node.font.size >= 10) params.class.push('caption');
                    if (node.font.italic == true) params.class.push('font-italic');
                    // - process attributes
                    Object.keys(node.attributes).map(function(key) {
                        let keytest = key.toLowerCase().trim();
                        let value = node.attributes[key];
                        if (keytest == 'class') {
                            params.class.push(value);
                        } else if (keytest == ':span') {
                            tmp.span = true;
                        } else if (keytest == ':omit') {
                            tmp.omit = true;
                        } else if (':length,:largo,len,length,largo'.split(',').includes(key)) {
                            tmp.lorem = value;
                        } else if (key == 'small') {
                            tmp.small = true;
                        } else if ('ucase,mayusculas,mayuscula'.split(',').includes(key)) {
                            if (value == 'true' || value == true) params.class.push('text-uppercase');
                        } else if ('capitales,capitalize,capital'.split(',').includes(key)) {
                            if (value == 'true' || value == true) params.class.push('text-capitalize');
                        } else if ('lcase,minusculas,minuscula'.split(',').includes(key)) {
                            if (value == 'true' || value == true) params.class.push('text-lowercase');
                        } else if (key == 'truncate') {
                            if (value == 'true' || value == true) params.class.push('text-truncate');
                        } else if (key == 'no-wrap') {
                            if (value == 'true' || value == true) params.class.push('text-no-wrap');
                        } else if ('weight,peso,grosor'.split(',').includes(key)) {
                            let valuetest = value.toLowerCase();
                            if ('thin,fina,100'.split(',').includes(valuetest)) {
                                params.class.push('font-weight-thin');
                            } else if ('light,300'.split(',').includes(valuetest)) {
                                params.class.push('font-weight-light');
                            } else if ('regular,400'.split(',').includes(valuetest)) {
                                params.class.push('font-weight-light');
                            } else if ('medium,500'.split(',').includes(valuetest)) {
                                params.class.push('font-weight-medium');
                            } else if ('bold,700'.split(',').includes(valuetest)) {
                                params.class.push('font-weight-bold');
                            } else if ('black,gruesa,900'.split(',').includes(valuetest)) {
                                params.class.push('font-weight-black');
                            }

                        } else if (key == 'color') {
                            if (key.indexOf(' ') != -1) {
                                let color_values = value.split(' ');
                                params.class.push(`${color_values[0]}--text text--${color_values[1]}`);
                            } else {
                                params.class.push(`${value}--text`);
                            }
                        } else if (key == 'align') {
                            let valuetest = value.toLowerCase();
                            if ('center,centro,centrar'.split(',').includes(valuetest)) {
                                params.class.push('text-xs-center');
                            } else if ('right,derecha'.split(',').includes(valuetest)) {
                                params.class.push('text-xs-right');
                            } else if ('left,izquierda,izquierdo'.split(',').includes(valuetest)) {
                                params.class.push('text-xs-left');
                            } else if ('justify,justificar,justificado'.split(',').includes(valuetest)) {
                                tmp.jstyle = 'text-align: justify; text-justify: inter-word;';
                                if (params.style) {
                                    params.style = params.style.split(';').push(tmp.jstyle).join(';');
                                } else {
                                    params.style = tmp.jstyle;
                                }
                            }

                        } else if (key == 'style') {
                            if (!params.style) params.styles = [];
                            params.styles.push(value);
                        } else {
                            if (key.charAt(0) != ':' && node.text != '' && text != node.text) {
                                params[':' + key] = value;
                            } else {
                                params[key] = value;
                            }
                        }
                    });
                    // - generate lorem.. ipsum text if within text
                    if (tmp.lorem) {
                        let loremIpsum = require('lorem-ipsum').loremIpsum;
                        text = loremIpsum({
                            count: parseInt(tmp.lorem),
                            units: 'words'
                        });
                    }
                    // - @TODO i18n here
                    // - tmp.small
                    if (tmp.small) {
                        text = `<small>${text}</small>`;
                    }
                    // - normalize class values (depending on vuetify version)
                    params.class = params.class.map(function(x) {
                        let resp = x;
                        resp.replaceAll('text-h1', 'display-4')
                            .replaceAll('text-h2', 'display-3')
                            .replaceAll('text-h3', 'display-2')
                            .replaceAll('text-h4', 'display-1')
                            .replaceAll('text-h5', 'headline')
                            .replaceAll('text-subtitle-1', 'subtitle-1')
                            .replaceAll('text-subtitle-2', 'subtitle-2')
                            .replaceAll('text-h6', 'title')
                            .replaceAll('text-body-1', 'body-1')
                            .replaceAll('text-body-2', 'body-2')
                            .replaceAll('text-caption', 'caption')
                            .replaceAll('text-overline', 'overline')
                        return resp;
                    });
                    //normalize params
                    if (params.class.length > 0) params.class = params.class.join(' ');
                    if (params.style) params.styles = params.styles.join(';');
                    //write code
                    if (!tmp.omit) {
                        if (context.hasParentID(node.id, 'def_textonly')==true || tmp.span) {
                            resp.open += context.tagParams('span', params) + text + '</span>\n';
                        } else if (context.hasParentID(node.id, 'def_card_title') && !params.class) {
                            resp.open += text + '\n';
                        } else {
                            resp.open += context.tagParams('div', params) + text + '</div>\n';
                        }
                    }
                    //
                }
                // return
                return resp;
            }
        },

        //..views..
        //*def_center
        //*def_html
        //*def_textonly
        //*def_margen
        //*def_contenedor
        //*def_flex
        //*def_spacer
        //*def_progress
        //*def_dialog

        'def_avatar': {
            x_level: '>2',
            x_icons: 'idea',
            x_text_contains: 'avatar',
            x_not_text_contains: 'fila',
            hint: 'Imagen con mascara redondeada',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_avatar', node);
                let img_params = {};
                // move :src to img src
                if (params.src) {
                    img_params.src = params.src;
                    delete params.src;
                }
                if (params[':src']) {
                    img_params[':src'] = params[':src'];
                    delete params[':src'];
                }
                // write tag
                resp.open += context.tagParams('v-avatar', params, false) + '\n';
                resp.open += context.tagParams('v-img', img_params, true) + '\n';
                resp.close += `</v-avatar>\n`;
                return resp;
            }
        },
        'def_boton': {
            x_level: '>2',
            x_icons: 'idea',
            x_text_contains: 'boton:',
            hint: 'Boton de vuetify',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_boton', node);
                // special cases
                // targets a scroll position ?
                if (params.scrollto) {
                    context.x_state.plugins['vue-scrollto'] = {
                        global: true,
                        npm: {
                            'vue-scrollto': '*'
                        }
                    };
                    if (params.scrollto.contains(',')) {
                        let element = params.scrollto.split(',')[0];
                        let offset = params.scrollto.split(',').pop().trim();
                        params['v-scroll-to'] = `{ element:'${element}', offset:${offset}, cancelable:false }`;
                    } else {
                        params['v-scroll-to'] = `{ element:'${params.scrollto}', cancelable:false }`;
                    }
                    delete params.scrollto;
                }
                // re-map props from older version of vuetify props to ones used here
                if ('flat' in params && params.flat == null) {
                    params.text = null;
                    delete params.flat;
                }
                if ('round' in params && params.round == null) {
                    params.rounded = null;
                    delete params.round;
                }
                // pre-process text
                let text = node.text.trim().replaceAll('boton:', '');
                if (context.x_state.central_config.idiomas.indexOf(',') != -1) {
                    // text uses i18n keys
                    let def_lang = context.x_state.central_config.idiomas.split(',')[0];
                    if (!context.x_state.strings_i18n[def_lang]) {
                        context.x_state.strings_i18n[def_lang] = {};
                    }
                    let crc32 = 't_' + context.hash(text);
                    context.x_state.strings_i18n[def_lang][crc32] = text;
                    text = `{{ $t('${crc32}') }}`;
                } else if (text.contains('$') && text.contains('{{') && text.contains('}}')) {
                    text = text.replaceAll('$params.', '')
                        .replaceAll('$variables.', '')
                        .replaceAll('$vars.', '')
                        .replaceAll('$store.', '$store.state.');
                }
                // write tag
                resp.open += context.tagParams('v-btn', params, false) + text + '\n';
                resp.close += `</v-btn>\n`;
                //event friendly name
                resp.state.friendly_name = text;
                return resp;
            }
        },
        'def_chip': {
            x_level: '>2',
            x_icons: 'idea',
            x_text_contains: 'chip:',
            hint: 'Chip de vuetify',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_chip', node);
                // pre-process text
                let text = node.text.trim().replaceAll('chip:', '');
                if (context.x_state.central_config.idiomas.indexOf(',') != -1) {
                    // text uses i18n keys
                    let def_lang = context.x_state.central_config.idiomas.split(',')[0];
                    if (!context.x_state.strings_i18n[def_lang]) {
                        context.x_state.strings_i18n[def_lang] = {};
                    }
                    let crc32 = 't_' + context.hash(text);
                    context.x_state.strings_i18n[def_lang][crc32] = text;
                    text = `{{ $t('${crc32}') }}`;
                } else if (text.contains('$') && text.contains('{{') && text.contains('}}')) {
                    text = text.replaceAll('$params.', '')
                        .replaceAll('$variables.', '')
                        .replaceAll('$vars.', '')
                        .replaceAll('$store.', '$store.state.');
                }
                // write tag
                resp.open += context.tagParams('v-chip', params, false) + `${text}\n`;
                resp.close += `</v-chip>\n`;
                resp.state.friendly_name = text;
                if (text.contains('{{')) resp.state.friendly_name = 'chip';
                return resp;
            }
        },

        //*def_avatar
        //*def_boton
        //*def_chip

        'def_menu': {
            x_level: '>2',
            x_icons: 'idea',
            x_text_contains: 'menu',
            x_not_text_contains: ':',
            hint: 'Barra de contenido escondible para menu de vuetify',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_menu', node);
                // special cases
                if (params.visible) {
                    params['v-model'] = params.visible;
                    delete params.visible;
                }
                // write tag
                resp.open += context.tagParams('v-menu', params, false) + `\n`;
                resp.close += `</v-menu>\n`;
                return resp;
            }
        },
        'def_barralateral': {
            x_level: '>2',
            x_icons: 'idea',
            x_text_contains: 'lateral',
            x_not_text_contains: ':',
            hint: 'Barra lateral (normalmente para un menu) escondible de vuetify',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_barralateral', node);
                // special cases
                if (params.visible) {
                    params['v-model'] = params.visible;
                    delete params.visible;
                }
                // write tag
                resp.open += context.tagParams('v-navigation-drawer', params, false) + `\n`;
                resp.close += `</v-navigation-drawer>\n`;
                return resp;
            }
        },
        'def_barrainferior': {
            x_level: '>2',
            x_icons: 'idea',
            x_text_contains: 'inferior',
            x_not_text_contains: ':',
            hint: 'Barra inferior escondible de vuetify',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_barrainferior', node);
                // special cases
                if (params.visible) {
                    params['v-model'] = params.visible;
                    delete params.visible;
                }
                // write tag
                resp.open += context.tagParams('v-bottom-sheet', params, false) + `\n`;
                resp.close += `</v-bottom-sheet>\n`;
                return resp;
            }
        },

        //*def_menu
        //*def_barralateral
        //*def_barrainferior

        'def_contenido': {
            x_level: 3,
            x_icons: 'idea',
            x_text_exact: 'contenido',
            x_or_hasparent: 'def_page,def_componente',
            hint: 'Contenido de pagina o componente vuetify',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_contenido',node);
                // write tag
                resp.open += context.tagParams('v-main', params, false) + `\n`;
                resp.close += `</v-main>\n`;
                return resp;
            }
        },
        'def_toolbar': {
            x_level: '>2',
            x_icons: 'idea',
            x_text_exact: 'toolbar',
            attributes_aliases: {
                'icon': 'icon,icono'
            },
            hint: 'Barra superior o toolbar vuetify que permite auto-alinear un titulo, botones, etc.',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                let tmp = {};
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_toolbar', node);
                // special cases
                if (params[':icon']) {
                    tmp.icon = `{{ ${params[':icon']} }}`;
                    delete params[':icon'];
                } else if (params.icon) {
                    tmp.icon = params.icon.toLowerCase().trim();
                    delete params.icon;
                }
                // write tag
                resp.open += context.tagParams('v-toolbar', params, false) + `\n`;
                if (tmp.icon && tmp.icon != '') {
                    resp.open += `<v-toolbar-side-icon><v-icon>${tmp.icon}</v-icon></v-toolbar-side-icon>\n`;
                } else if (tmp.icon && tmp.icon == '') {
                    resp.open += `<v-toolbar-side-icon></<v-toolbar-side-icon>\n`;
                }
                resp.close = `</v-toolbar>\n`;
                return resp;
            }
        },
        'def_toolbar_title': {
        	x_level: '>3',
        	x_empty: 'icons',
        	x_all_hasparent: 'def_toolbar',
        	hint: 'Titulo para nodo toolbar',
        	func: async function(node, state) {
                let resp = context.reply_template({ state });
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_toolbar_title', node);
                // special cases
                if (params.color) {
                	if (!params.class) params.class='';
                	let tmp = params.class.split(' ');
                	if (params.color.contains(' ')) {
                		let name = params.color.split(' ')[0];
                		let tint = params.color.split(' ').pop();
                		tmp.push(`${name}--text text--${tint}`);
                	} else {
                		tmp.push(`${params.color}--text`);
                	}
                	params.class = tmp.join(' ');
                	delete params.color;
                }
                // process title (node.text)
                let text = node.text.trim();
                if (context.x_state.central_config.idiomas.indexOf(',') != -1) {
                    // text uses i18n keys
                    let def_lang = context.x_state.central_config.idiomas.split(',')[0];
                    if (!context.x_state.strings_i18n[def_lang]) {
                        context.x_state.strings_i18n[def_lang] = {};
                    }
                    let crc32 = 't_' + context.hash(text);
                    context.x_state.strings_i18n[def_lang][crc32] = text;
                    text = `{{ $t('${crc32}') }}`;
                } else if (text.contains('$') && text.contains('{{') && text.contains('}}')) {
                    text = text.replaceAll('$params.', '')
                        .replaceAll('$variables.', '')
                        .replaceAll('$vars.', '')
                        .replaceAll('$store.', '$store.state.');
                }
                // write output
                resp.open += context.tagParams('v-toolbar-title',params,false) + text + '\n';
                resp.close = '</v-toolbar-title>\n';
                return resp;
            }
        },

        'def_layout_custom': {
        	x_level: '>3',
        	x_icons: 'idea',
            x_text_contains: 'layout',
            x_not_text_contains: ':',
        	hint: 'Layout (custom)',
        	func: async function(node, state) {
                let resp = context.reply_template({ state });
                //code
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_layout_custom', node);
                resp.open += context.tagParams('v-layout',params,true);
                return resp;
            }
        },

        'def_divider': {
        	x_level: '>2',
        	x_icons: 'idea',
            x_text_contains: '---',
        	hint: 'Divisor, separador visual',
        	func: async function(node, state) {
                let resp = context.reply_template({ state });
                //code
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_divider', node);
                resp.open += context.tagParams('v-divider',params,true);
                return resp;
            }
        },

        'def_slot': {
        	x_level: '>2',
        	x_icons: 'list',
            x_or_hasparent: 'def_page,def_componente,def_layout',
        	hint: 'Template slot; nombre o nombre=valor',
        	func: async function(node, state) {
                let resp = context.reply_template({ state });
                //code
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_slot', node);
                if (node.text.contains('=')) {
                    let extract = require('extractjs')();
                    let elements = extract(`{name}={value}`,node.text);
                    //@todo test this after def_datatable exists
                    if (context.hasParentID(node.id, 'def_datatable')==true) {
                        if (elements.name=='items') {
                            elements.name = 'item';
                        } else if (elements.name=='headers') {
                            elements.name = 'header';
                        } else if (elements.name=='expand') {
                            elements.name = 'expanded-item';
                        }
                    }
                    params[`v-slot:${elements.name}`] = elements.value;
                } else {
                    params[`v-slot:${node.text.trim()}`] = null;
                }
                resp.open += context.tagParams('template',params,false)+'\n';
                resp.close = '</template>\n';
                return resp;
            }
        },

        'def_div': {
        	x_level: '>2',
        	x_icons: 'idea',
            x_text_exact: 'div',
            x_or_hasparent: 'def_page,def_componente,def_layout',
        	hint: 'HTML div/bloque',
        	func: async function(node, state) {
                let resp = context.reply_template({ state });
                //code
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_div', node);
                resp.open += context.tagParams('div',params,false)+'\n';
                resp.close = '</div>';
                return resp;
            }
        },

        'def_agrupar': {
        	x_level: '>2',
        	x_icons: 'idea',
            x_text_exact: 'agrupar',
            x_or_hasparent: 'def_page,def_componente,def_layout',
        	hint: 'Agrupa elementos flex hijos horizontalmente',
        	func: async function(node, state) {
                let resp = context.reply_template({ state });
                //code
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_agrupar', node);
                if (params.centrar && params.centrar==true) {
                    params['justify-center'] = null;
                    params['align-center'] = null;
                    delete params.centrar;
                }
                resp.open += context.tagParams('v-row',params,false)+'\n';
                resp.close = '</v-row>';
                return resp;
            }
        },

        'def_bloque': {
        	x_level: '>2',
        	x_icons: 'idea',
            x_text_exact: 'bloque',
            x_or_hasparent: 'def_page,def_componente,def_layout',
        	hint: 'Bloque; una fila de algo en bloque completo',
        	func: async function(node, state) {
                let resp = context.reply_template({ state });
                //code
                let params = aliases2params('def_bloque', node);
                params.column = null;
                if (params.centrar && params.centrar==true) {
                    params['justify-center'] = null;
                    params['align-center'] = null;
                    delete params.centrar;
                }
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                resp.open += context.tagParams('v-layout',params,false)+'\n';
                resp.close = '</v-layout>';
                return resp;
            }
        },

        'def_hover': {
        	x_level: '>2',
        	x_icons: 'idea',
            x_text_exact: 'hover',
            hint: 'Crea variable $hover con true si usuario posa mouse sobre su hijo',
        	func: async function(node, state) {
                let resp = context.reply_template({ state });
                //code
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                let params = aliases2params('def_hover', node);
                resp.open += context.tagParams('v-hover',params,false)+'\n';
                resp.close = '</v-hover>';
                return resp;
            }
        },

        'def_tooltip': {
        	x_level: '>2',
        	x_icons: 'idea',
            x_text_exact: 'tooltip',
            attributes_aliases: {
                'texto':        'texto,text,:text,:texto',
                'class':        'class,:class'
            },
            hint: 'Muestra el mensaje definido cuando se detecta mouse sobre sus hijos',
        	func: async function(node, state) {
                let resp = context.reply_template({ state });
                let params = aliases2params('def_tooltip', node);
                let tmp = { text:'', params_span:{} };
                if (params.texto) {
                    tmp.text = `{{ ${params.texto} }}`;
                    delete params.texto;
                }
                if (params.class) {
                    tmp.params_span.class = params.class;
                    delete params.class;
                } else if (params[':class']) {
                    tmp.params_span[':class'] = params.class;
                    delete params[':class'];
                }
                //code
                if (node.text_note != '') resp.open = `<!-- ${node.text_note} -->`;
                resp.open += context.tagParams('v-tooltip',params,false)+'\n';
                resp.open += context.tagParams('template',{ 'v-slot:activator':'{ on }' },false)+'\n';
                resp.close = '</template>';
                resp.close += context.tagParams('span',tmp.params_span,false) + tmp.text + '</span>\n';
                resp.close += '</v-tooltip>';
                return resp;
            }
        },

        'def_datatable': {
        	x_level: '>2',
        	x_icons: 'idea',
            x_text_exact: 'tabla',
            attributes_aliases: {
                'drag':                 'draggable,:draggable,sort,:sort,drag,:drag,manilla,:manilla',
                'class':                'class,:class',
                'width':                'width,ancho',
                'height':               'height,alto',
                'items-per-page-text':  'rows-per-page-text'
            },
            hint: 'Dibuja una tabla con datos.',
        	func: async function(node, state) {
                let resp = context.reply_template({ state });
                let params = aliases2params('def_datatable', node);
                if (params.drag && params[':items']) {
                    //install sortablejs plugin
                    params.ref=node.id;
                    context.x_state.pages[state.current_page].imports.sortablejs = 'Sortable';
                    resp.open += `<vue_mounted>
                    let tabla_${node.id} = this.$refs.${node.id}.$el.getElementsByTagName('tbody')[0];
                    const _self = this;
                    Sortable.create(tabla_${node.id}, {
                        handle: '.${params.drag}',
                        onEnd({ newIndex, oldIndex }) {
                            const rowSelected = _self.${params[':items']}.splice(oldIndex,1)[0];
                            _self.${params[':items']}.splice(newIndex,0,rowSelected);
                        }
                    });
                    </vue_mounted>`;
                    delete params.drag;
                }
                //pass header name/id for headers future var
                resp.state.datatable_id = node.id + '_headers';
                params[':headers'] = resp.state.datatable_id;
                //code
                if (node.text_note != '') resp.open += `<!-- ${node.text_note} -->`;
                resp.open += context.tagParams('v-data-table',params,false)+'\n';
                resp.close = '</v-data-table>';
                return resp;
            }
        },

        'def_datatable_headers': {
        	x_level: '>3',
        	x_icons: 'edit',
            x_text_exact: 'headers',
            x_all_hasparent: 'def_datatable',
            hint: 'Define los titulos de las columnas de la tabla padre y sus propiedades.',
        	func: async function(node, state) {
                let resp = context.reply_template({ state });
                context.x_state.pages[state.current_page].variables[resp.state.datatable_id] = [];
                context.x_state.pages[state.current_page].var_types[resp.state.datatable_id] = 'array';
                return resp;
            }
        },

        'def_datatable_headers_title': {
        	x_level: '>4',
            x_empty: 'icons',
            x_all_hasparent: 'def_datatable_headers',
            attributes_aliases: {
                'value':                'value,campo',
                'sortable':             'orden,ordenable,sortable',
                'ucase':                'ucase,mayusculas,mayuscula',
                'capital':              'capitales,capitalize,capital',
                'lcase':                'lcase,minusculas,minuscula',
                'nowrap':               'no-wrap',
                'weight':               'weight,peso,grosor',
                'fontsize':             'font,size'                
            },
            hint: 'Define las propiedades del titulo de una columna de la tabla padre.',
        	func: async function(node, state) {
                let resp = context.reply_template({ state });
                let params = aliases2params('def_datatable_headers_title', node);
                let item = { class:[], text:node.text.trim() };
                if (params.class) item.class = params.class.split(' ');
                if (node.font.size<=10) item.class.push('caption');
                if (node.font.bold==true) item.class.push('font-weight-bold');
                if (node.font.italic==true) item.class.push('font-italic');
                if (params.value) item.value = params.value;
                if (params.sortable) item.sortable = params.sortable;
                if (params.ucase && params.ucase==true) item.class.push('text-uppercase');
                if (params.capital && params.capital==true) item.class.push('text-capitalize');
                if (params.lcase && params.lcase==true) item.class.push('text-lowercase');
                if (params.truncate && params.truncate==true) item.class.push('text-truncate');
                if (params.nowrap && params.nowrap==true) item.class.push('text-no-wrap');
                if (params.fontsize) item.class.push(params.fontsize);
                if (params.weight) {
                    if ('thin,fina,100'.includes(params.weight)) item.class.push('font-weight-thin');
                    if ('light,300'.includes(params.weight)) item.class.push('font-weight-light');
                    if ('regular,400'.includes(params.weight)) item.class.push('font-weight-regular');
                    if ('medium,500'.includes(params.weight)) item.class.push('font-weight-medium');
                    if ('bold,700'.includes(params.weight)) item.class.push('font-weight-bold');
                    if ('black,gruesa,900'.includes(params.weight)) item.class.push('font-weight-black');
                }
                //
                delete params.class;    delete params.refx;
                delete params.value;    delete params.sortable; delete params.ucase;
                delete params.capital;  delete params.lcase;    delete params.truncate;
                delete params.nowrap;   delete params.weight;   delete params.fontsize;
                item = {...item, ...params};
                item.class = item.class.join(' ');
                if (item.class.trim()=='') delete item.class;
                //assign struct to datatable header var
                if (resp.state.datatable_id) {
                    context.x_state.pages[state.current_page].variables[resp.state.datatable_id].push(item);
                    context.x_state.pages[state.current_page].var_types[`${resp.state.datatable_id}[${context.x_state.pages[state.current_page].variables[resp.state.datatable_id].length-1}]`] = typeof item;
                }
                return resp;
            }
        },

        'def_datatable_fila': {
        	x_level: '>3',
        	x_icons: 'idea',
            x_text_exact: 'fila',
            x_all_hasparent: 'def_datatable',
            hint: 'Crea una nueva fila en la tabla padre.',
        	func: async function(node, state) {
                let resp = context.reply_template({ state });
                let params = aliases2params('def_datatable_fila', node, true);
                //code
                if (node.text_note != '') resp.open += `<!-- ${node.text_note} -->`;
                resp.open += context.tagParams('tr',params,false)+'\n';
                resp.close = '</tr>';
                return resp;
            }
        },

        'def_datatable_col': {
        	x_level: '>4',
        	x_icons: 'idea',
            x_text_exact: 'columna',
            x_all_hasparent: 'def_datatable_fila',
            hint: 'Agrupa sus hijos en una columna de una tabla.',
        	func: async function(node, state) {
                let resp = context.reply_template({ state });
                let params = aliases2params('def_datatable_col', node, true);
                //code
                if (node.text_note != '') resp.open += `<!-- ${node.text_note} -->`;
                resp.open += context.tagParams('td',params,false)+'\n';
                resp.close = '</td>';
                return resp;
            }
        },

        //*def_contenido
        //*def_toolbar
        //*def_toolbar_title
        //**def_layout_custom - @todo needs testing
        //**def_divider
        //**def_slot
        //**def_div
        //**def_agrupar
        //**def_bloque
        //**def_hover
        //**def_tooltip - @todo re-test after def_datatable and def_datatable_col is done

        //**def_datatable (@todo re-test def_slot after this one is done)
                                //28abr going to need this ref for _headers
                                //context.x_state.pages[state.current_page].var_types[tmp.field] = tmp.type;
                                //context.x_state.pages[state.current_page].variables[tmp.field] = params.value;

        //**def_datatable_headers
        //**def_datatable_headers_title
        //**def_datatable_fila
        //**def_datatable_col


        //def_paginador	

        //def_sparkline
        //def_highcharts
        //def_trend

        //def_listado
        //def_listado_grupo
        //def_listado_dummy
        //def_listado_fila
        //def_listado_fila_accion
        //def_listado_fila_contenido
        //def_listado_fila_titulo
        //def_listado_fila_subtitulo
        //def_listado_fila_avatar
        //def_icono
        //def_animar
        //def_imagen
        //def_qrcode
        //def_analytics_evento
        //def_medianet_ad
        //def_mapa
        //def_youtube_playlist
        //def_youtube

        'def_event_mounted': {
            x_icons: 'help',
            x_level: 3,
            x_text_contains: ':mounted',
            hint: 'Evento especial :mounted en pagina vue',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state,
                    hasChildren: true
                });
                let params = {};
                resp.open = context.tagParams('vue_mounted', {}, false);
                if (node.text_note != '') resp.open += `//${node.text_note}\n`;
                resp.close = '</vue_mounted>';
                resp.state.from_script=true;
                return resp;
            }
        },

        'def_event_server': {
            x_icons: 'help',
            x_level: 3,
            x_text_contains: ':server',
            hint: 'Evento especial :server en pagina vue',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state,
                    hasChildren: true
                });
                let params = aliases2params('def_event_server',node);
                resp.open = context.tagParams('server_asyncdata', {}, false);
                if (node.text_note != '') resp.open += `//${node.text_note}\n`;
                if (!params.return) resp.open += `let resp={};`;
                resp.close = '</server_asyncdata>';
                resp.state.from_server=true;
                resp.state.from_script=true;
                return resp;
            }
        },

        'def_event_method': {
            x_icons: 'help',
            x_level: 3,
            x_not_text_contains: ':',
            attributes_aliases: {
                'm_params':     ':params,params',
                'timer_time':   'timer:time,interval,intervalo,repetir',
                'async':        ':async,async'
            },
            hint: 'Funcion tipo evento en pagina vue',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state,
                    hasChildren: true
                });
                let params = aliases2params('def_event_method',node);
                params.type='async';
                params.name=node.text.trim();
                if (params.async && params.async=='false') params.type='sync';
                if (params.async) delete params.async;
                //code
                resp.open = context.tagParams('vue_event_method', params, false);
                if (node.text_note != '') resp.open += `//${node.text_note}\n`;
                resp.close = '</vue_event_method>';
                resp.state.from_script=true;
                return resp;
            }
        },

        'def_event_element': {
            x_icons: 'help',
            x_level: '>2',
            x_not_text_contains: ':server,:mounted,condicion si,otra condicion, ',
            hint:  `Evento de un elemento visual (ej. imagen->?click).
                    Se puede enlazar a otro evento de la misma página, en cuyo caso sus atributos se traspasan como parametros.`,
            func: async function(node, state) {
                let resp = context.reply_template({
                    state,
                    hasChildren: true
                });
                //get variables etc from node
                let attrs = aliases2params('def_event_element',node);
                let tmp = { event_test:node.text.trim() };
                let params = { n_params:[], v_params:[], event:node.text.trim(), id:node.id };
                let isNumeric = function(n) {
                    return !isNaN(parseFloat(n)) && isFinite(n);
                };
                //add event name aliases if not son of def_componente_view
                if (!state.from_componente) {
                    if (['post:icon:click','post:icon'].includes(tmp.event_test)==true) params.event = 'click:append';
                    if (['pre:icon:click','pre:icon'].includes(tmp.event_test)==true) params.event = 'click:prepend'; 
                }
                //get parent node id
                let parent_node = await context.dsl_parser.getParentNode({ id: node.id });
                params.parent_id = parent_node.id;
                params.friendly_name = "";
                //if (!state.from_componente) {
                let normal = require('url-record'), ccase = require('fast-case');
                let short_event = params.event.split('.')[0].split(':')[0];
                let tmp_name = '';
                if (parent_node.text.contains('$variables')) {
                    tmp_name = short_event;
                } else {
                    tmp_name = short_event+'-'+parent_node.text.split('.')[0];
                }
                if (state.friendly_name && state.friendly_name!='') {
                    params.friendly_name = normal(state.friendly_name).split('-')[0];
                    tmp_name = short_event+'-'+params.friendly_name.split('.')[0];
                }
                params.friendly_name = tmp_name;
                //params.friendly_name = normal(tmp_name); //.split('-')[0];
                params.friendly_name = ccase.camelize(params.friendly_name); //`${params.event.split('.')[0]}_`+
                if (params.friendly_name in context.x_state.pages[state.current_page].track_events) {
                    context.x_state.pages[state.current_page].track_events[params.friendly_name].count += 1;
                    params.friendly_name = params.friendly_name+context.x_state.pages[state.current_page].track_events[params.friendly_name].count;
                } else {
                    context.x_state.pages[state.current_page].track_events[params.friendly_name] = { count:1 };
                }
                //has link? ex. img @event='othermethod'
                if (node.link!='' && node.link.contains('ID_')) {
                    // get event friendly name - @todo check when target is a declared method and not an event - checked and ready!
                    params.link = 'x';
                    params.link_id = node.link;
                    let link_node = await context.dsl_parser.getNode({ id:node.link, recurse:false });
                    if (link_node && link_node.valid==true) {
                        params.link = link_node.text;
                    }
                }
                //
                delete attrs.refx;
                //convert keys to params n_params, and values to v_params
                for (let key in attrs) {
                    if (key.charAt(0)==':') {
                        params.n_params.push(key.right(key.length-1));
                        let val_tmp = attrs[key];
                        if (attrs[key].charAt(0)=='$') {
                            val_tmp = val_tmp.right(val_tmp.length-1);
                        }
                        params.v_params.push(val_tmp);
                    } else {
                        params.n_params.push(key);                    
                        if (isNumeric(attrs[key])) {
                            params.v_params.push(attrs[key]);
                        } else if  (attrs[key]=='') {
                            params.v_params.push('$event');
                        } else if  (attrs[key].contains('this.') || attrs[key].contains('$event')) {
                            params.v_params.push(attrs[key]);
                        } else if  (attrs[key].contains('**') && node.icons.includes('bell')) {
                            let sv = getTranslatedTextVar(attrs[key]);
                            params.v_params.push(sv);
                        } else {
                            params.v_params.push(`'${attrs[key]}'`);
                        }
                    }
                }
                //add npm packages when needed
                if (tmp.event_test=='visibility') {
                    context.x_state.npm['vue-observe-visibility'] = '*';
                    context.x_state.nuxt_config.head_script['polyfill_visibility'] = { src:'https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver' };
                    context.x_state.pages[state.current_page].imports['vue-observe-visibility'] = `{ ObserveVisibility }`;
                    context.x_state.pages[state.current_page].directives['observe-visibility'] = 'ObserveVisibility';
                }
                //code
                params.n_params = params.n_params.join(',');
                params.v_params = params.v_params.join(',');
                resp.open = context.tagParams('vue_event_element', params, false);
                if (node.text_note != '') resp.open += `//${node.text_note}\n`;
                resp.close = '</vue_event_element>';
                resp.state.from_script=true;
                return resp;
            }
        },
        
        'def_script': {
            x_icons: 'desktop_new',
            x_level: '>2',
            x_text_exact: 'script',
            x_or_hasparent: 'def_page,def_componente,def_layout',
            hint:   `Representa un tag script inyectado en el lugar indicado. Permite escribir y ejecutar código en la posición definida.
                     Si se define un link, el link se especifica con atributo src y en sus hijos el script se ejecuta luego de cargarlo.`,
            func: async function(node, state) {
                let resp = context.reply_template({
                    state,
                    hasChildren: true
                });
                let params = aliases2params('def_script',node);
                if (node.link!='') params.src = node.link;
                //add packages
                context.x_state.npm['vue-script2'] = '*';
                context.x_state.plugins['vue-script2'] = { global:true, npm: { 'vue-script2':'*' }};
                //code
                resp.open = context.tagParams('script2', params, false);
                if (node.text_note != '') resp.open += `//${node.text_note}\n`;
                resp.close = '</script2>';
                resp.state.from_script=true;
                return resp;
            }
        },

        //*def_script
        //*def_event_server
        //*def_event_mounted
        //*def_event_method
        //*def_event_element

        'def_condicion_view': {
            x_icons: 'help',
            x_level: '>2',
            x_text_contains: 'condicion si',
            x_text_pattern: [
            `condicion si "*" +(es|no es|es menor a|es menor o igual a|es mayor a|es mayor o igual a|esta entre|contiene registro) "*"`,
            `condicion si "*" es +(objeto|array|struct|string|texto)`,
            `condicion si "*" es +(numero|entero|int|booleano|boleano|boolean|fecha|date|email)`,
            `condicion si "*" no es +(numero|entero|int|booleano|boleano|boolean|fecha|date|email)`,
            `condicion si "*" +(esta vacia|esta vacio|is empty|existe|exists|no es indefinido|no es indefinida|esta definida|no esta vacio|existe|esta definida|no es nula|no es nulo|es nula|not empty)`,
            `condicion si "*" +(no contiene registros|contiene registros)`,
            `condicion si "*" esta entre "*" inclusive`
            ],
            x_or_hasparent: 'def_page,def_componente,def_layout',
            hint:   `Declara que la/s vista/s hija/s deben cumplir la condicion indicada para ser visibles.`,
            func: async function(node, state) {
                let resp = context.reply_template({
                    state,
                    hasChildren: true
                });
                if (resp.state.from_script && resp.state.from_script==true) return {...resp,...{ valid:false }};
                // detect which pattern did the match
                let match = require('minimatch');
                let which = -1;
                for (let x of context.x_commands['def_condicion_view'].x_text_pattern) {
                    which+=1;
                    let test = match(node.text,x);
                    if (test==true) break;
                };
                // extract the values
                let extract = require('extractjs')();
                let defaults = { variable:'', operator:'es', value:'' };
                let patterns = [
                    `condicion si "{variable}" {operator} "{value}"`,
                    `condicion si "{variable}" {operator}`,
                    `condicion si "{variable}" {operator}`,
                    `condicion si "{variable}" {operator}`,
                    `condicion si "{variable}" {operator}`,
                    `condicion si "{variable}" {operator}`,
                    `condicion si "{variable} esta entre "{value}" inclusive`
                ];
                let elements = {...defaults,...extract(patterns[which],node.text)};
                // pre-process elements
                if (typeof elements.variable === 'string' && elements.variable.contains('**') && node.icons.includes('bell')) elements.variable = getTranslatedTextVar(elements.variable);
                if (typeof elements.value === 'string' && elements.value.contains('**') && node.icons.includes('bell')) elements.value = getTranslatedTextVar(elements.value);
                if (typeof elements.variable === 'string' && (elements.variable.contains('$variables.') || 
                    elements.variable.contains('$vars.') ||
                    elements.variable.contains('$params.') ||
                    elements.variable.contains('$store.') ||
                    elements.variable.contains('$route.'))
                    ) {
                } else if (typeof elements.variable === 'string' && elements.variable.charAt(0)=='$') {
                    elements.variable = elements.variable.right(elements.variable.length-1);
                }
                // test for siblings conditions
                elements.type = 'v-if';
                let before_me = await context.dsl_parser.getBrotherNodesIDs({ id:node.id, before:true, after:false, array:true });
                if (before_me.length>0) {
                    if (before_me[0].TEXT && before_me[0].TEXT.contains('condicion si')) {
                        elements.type = 'v-else-if'
                    }
                }
                // tag params
                let params = aliases2params('def_condicion_view',node);
                params = {...params, ...{
                    target: 'template',
                    tipo: elements.type,
                    operador: elements.operator,
                    valor: elements.value
                }};
                if (node.nodes_raw.length==1) params.target=node.nodes_raw[0].attribs.ID; //.id
                if (params.individual && params.individual==true) {
                    params.tipo = 'v-if'; elements.type = 'v-if';
                    delete params.individual;
                }
                // get full expression, depending on operator
                if (elements.operator=='idioma es') {
                    params.expresion = `this.$i18n && this.$i18n.locale=='${elements.variable}'`;
                } else if (['es','=','eq'].includes(elements.operator)) {
                    if (elements.value==true && elements.value!=1) {
                        params.expresion = elements.variable;
                    } else if (elements.value==false && elements.value!=0) {
                        params.expresion = '!'+elements.variable;
                    } else if (typeof elements.value === 'string' && (
                        elements.value.contains('$variables.') || 
                        elements.value.contains('$vars.') ||
                        elements.value.contains('$params.') ||
                        elements.value.contains('$store.')
                    )) {
                        params.expresion = `${elements.variable} == ${elements.value}`;
                    } else if (typeof elements.value === 'number') {
                        params.expresion = `${elements.variable} == ${elements.value}`;
                    } else if (typeof elements.value === 'string' &&
                                elements.value.charAt(0)=='(' && elements.value.right(1)==')') {
                        let temp = elements.value.substr(1,elements.value.length-2);
                        params.expresion = `${elements.variable} == ${temp}`;
                    } else if (typeof elements.value === 'string' &&
                        elements.value.charAt(0)=='$' && elements.value.contains(`$t('`)==false) {
                        let temp = elements.value.right(elements.value.length-1);
                        params.expresion = `${elements.variable} == ${temp}`;
                    } else {
                        params.expresion = `${elements.variable} == '${elements.value}'`;
                    }

                } else if ('es string,es texto,string,texto'.split(',').includes(elements.operator)) {
                    params.expresion = `_.isString(${elements.variable})`;

                } else if ('es numero,es int,numero,int'.split(',').includes(elements.operator)) {
                    params.expresion = `_.isNumber(${elements.variable})`;

                } else if ('es boolean,es boleano,es booleano,booleano,boleano,boolean'.split(',').includes(elements.operator)) {
                    params.expresion = `_.isBoolean(${elements.variable})`;
                
                } else if ('es fecha,es date,fecha,date'.split(',').includes(elements.operator)) {
                    params.expresion = `_.isDate(${elements.variable})`;
                
                } else if ('es entero,es int,entero,int'.split(',').includes(elements.operator)) {
                    params.expresion = `_.isFinite(${elements.variable})`;
                
                } else if ('es array,array'.split(',').includes(elements.operator)) {
                    params.expresion = `_.isArray(${elements.variable})`;

                } else if ('es struct,struct'.split(',').includes(elements.operator)) {
                    params.expresion = `_.isObject(${elements.variable}) && !_.isArray(${elements.variable}) && !_.isFunction(${elements.variable})`;

                } else if ('es objeto,objeto'.split(',').includes(elements.operator)) {
                    params.expresion = `_.isObject(${elements.variable})`;
                
                } else if ('es correo,es email,email,correo'.split(',').includes(elements.operator)) {
                    params.expresion = `_.isString(${elements.variable}) && /\S+@\S+\.\S+/.test(${elements.variable})`;

                } else if ('no es correo,no es email'.split(',').includes(elements.operator)) {
                    params.expresion = `!(_.isString(${elements.variable}) && /\S+@\S+\.\S+/.test(${elements.variable}))`;

                //numeric testings
                } else if ('es menor o igual a,es menor o igual que'.split(',').includes(elements.operator)) {
                    params.expresion = `_.isNumber(${elements.variable}) && _.isNumber(${elements.value}) && ${elements.variable} <= ${elements.value}`;
                
                } else if ('es menor a,es menor que'.split(',').includes(elements.operator)) {
                    params.expresion = `_.isNumber(${elements.variable}) && _.isNumber(${elements.value}) && ${elements.variable} < ${elements.value}`;

                } else if ('es mayor o igual a,es mayor o igual que'.split(',').includes(elements.operator)) {
                    params.expresion = `_.isNumber(${elements.variable}) && _.isNumber(${elements.value}) && ${elements.variable} >= ${elements.value}`;

                } else if ('es mayor a,es mayor que'.split(',').includes(elements.operator)) {
                    params.expresion = `_.isNumber(${elements.variable}) && _.isNumber(${elements.value}) && ${elements.variable} > ${elements.value}`;

                } else if ('esta entre'==elements.operator && elements.value.contains(',')) {
                    let from = elements.value.split(',')[0];
                    let until = elements.value.split(',').pop();
                    params.expresion = `${elements.variable} >= ${from} && ${elements.variable} <= ${until}`;

                // strings
                } else if ('no esta vacio,not empty'.split(',').includes(elements.operator)) {
                    params.expresion = `(_.isObject(${elements.variable}) || (_.isString(${elements.variable})) &&  !_.isEmpty(${elements.variable})) || _.isNumber(${elements.variable}) || _.isBoolean(${elements.variable})`;

                } else if ('esta vacio,is empty,esta vacia'.split(',').includes(elements.operator)) {
                    params.expresion = `(_.isObject(${elements.variable}) ||_.isString(${elements.variable})) &&  _.isEmpty(${elements.variable})`;

                // other types
                } else if ('existe,exists,no es indefinido,no es indefinida,esta definida'.split(',').includes(elements.operator)) {
                    params.expresion = `!_.isUndefined(${elements.variable})`;

                } else if ('no existe,doesnt exists,es indefinido,es indefinida,no esta definida'.split(',').includes(elements.operator)) {
                    params.expresion = `_.isUndefined(${elements.variable})`;

                } else if ('no es nula,no es nulo'.split(',').includes(elements.operator)) {
                    params.expresion = `!_.isNull(${elements.variable})`;

                } else if ('es nula,es nulo'.split(',').includes(elements.operator)) {
                    params.expresion = `_.isNull(${elements.variable})`;

                } else if ('no es,!=,neq'.split(',').includes(elements.operator)) {
                    //@todo check if value is string - pendieng testing
                    params.expresion = `${elements.variable}!=${elements.value}`;

                // records
                } else if ('no contiene registros,contains no records'.split(',').includes(elements.operator)) {
                    params.expresion = `${elements.variable} && ${elements.variable}.length==0`;

                } else if ('contiene registros,contains records'.split(',').includes(elements.operator)) {
                    params.expresion = `${elements.variable} && ${elements.variable}.length`; //@todo check if this needs to be .length>0

                } else if ('contiene registro,contiene item'.split(',').includes(elements.operator)) {
                    params.expresion = `_.contains(${elements.variable},'${elements.value}')`;

                } else if ('contiene,contains'.split(',').includes(elements.operator)) {
                    params.expresion = `${elements.variable}.toLowerCase().indexOf(${elements.value}.toLowerCase())!=-1`;

                } else {
                    //operator not defined
                    context.x_console.outT({ message:`Operator (${elements.operator}) not defined in 'condicion si' x_command`, color:'red', data:{elements,params,which} });
                    throw `Operator ${elements.operator} not defined in '${node.text}'`;
                    //params.expresion = `(AQUI VAMOS: ${node.text})`;
                }

                //comments?
                if (node.text_note != '') resp.open += `<!--${node.text_note}-->\n`;
                // prepare expressions
                let expresion_js = params.expresion. replaceAll('$variables.','this.')
                                                    .replaceAll('$vars.','this.')                                   
                                                    .replaceAll('$params.','this.')
                                                    .replaceAll('$store.','this.$store.state.');
                let expresion_view = params.expresion.   replaceAll('$variables.','')
                                                        .replaceAll('$vars.','')
                                                        .replaceAll('$params.','')
                                                        .replaceAll('$store.','$store.state.');
                resp.state.meta = { if_js:expresion_js, if_view:expresion_view, params, elements };
                // prepare virtual vars for underscore support
                if (params.expresion && params.expresion.contains('_.')) {
                    context.x_state.pages[state.current_page].imports['underscore'] = '_';
                    //create virtual var 'computed'
                    resp.open += context.tagParams('vue_computed', {
                        name: `${node.id}_if`,
                        type: 'computed'
                    }, false);
                    resp.open += `return (${expresion_js});`;
                    resp.open += `</vue_computed>`;
                    //@todo seems the expresion should be the new var here... (was not on the cfc)
                    params.expresion = `${node.id}_if`;
                }
                //create vue_if or template tag code (in tags, this. don't go)
                if (!(params.expresion.contains('_if'))) params.expresion = expresion_view;
                if (params.target=='template') {
                    // code
                    resp.open += context.tagParams('template', {
                        [params.tipo]: params.expresion
                    }, false);
                    resp.close = `</template>`;
                } else {
                    // code
                    resp.open += context.tagParams('vue_if', params, false);
                    resp.close = `</vue_if>`;
                }
                return resp;
            }
        },

        'def_otra_condicion_view': {
            x_icons: 'help',
            x_level: '>2',
            x_text_exact: 'otra condicion',
            hint:   `Visibiliza sus hijos en caso de no cumplirse la condicion anterior.`,
            func: async function(node, state) {
                let resp = context.reply_template({
                    state,
                    hasChildren: true
                });
                if (resp.state.from_script && resp.state.from_script==true) return {...resp,...{ valid:false }};
                //code
                if (node.nodes_raw.length>1) {
                    if (node.text_note != '') resp.open = `//${node.text_note}\n`;
                    resp.open += context.tagParams('template', { 'v-else': null }, false);
                } else if (node.nodes_raw.length==1) {
                    if (node.text_note != '') resp.open = `//${node.text_note}\n`;
                    resp.open += context.tagParams('vue_if', { 
                        'expresion':'',
                        'tipo':'v-else',
                        'target': node.nodes_raw[0].attribs.ID 
                    }, false);
                    resp.close = `</vue_if>`;
                } else {
                    // dont write if we dont have children
                }
                return resp;
            }
        },

        'def_condicion': {
            x_icons: 'help',
            x_level: '>2',
            x_text_contains: 'condicion si',
            hint:   `Declara que los hijo/s deben cumplir la condicion indicada para ser ejecutados.`,
            func: async function(node, state) {
                let resp = context.reply_template({
                    state,
                    hasChildren: true
                });
                if (!resp.state.from_script || (resp.state.from_script && resp.state.from_script==false)) return {...resp,...{ valid:false }};
                let condicion = await context.x_commands['def_condicion_view'].func(node, { ...state, ...{
                    from_script:false
                }});
                //code
                if (node.text_note != '') resp.open = `//${node.text_note}\n`;
                if (condicion.state.meta.params.tipo=='v-if') {
                    resp.open += `if (${condicion.state.meta.if_js}) {\n`;
                } else {
                    resp.open += `else if (${condicion.state.meta.if_js}) {\n`;
                }
                resp.close = `}\n`;
                return resp;
            }
        },

        'def_otra_condicion': {
            x_icons: 'help',
            x_level: '>2',
            x_text_exact: 'otra condicion',
            hint:   `Ejecuta sus hijos en caso de no cumplirse la condicion anterior.`,
            func: async function(node, state) {
                let resp = context.reply_template({
                    state,
                    hasChildren: true
                });
                if (!resp.state.from_script || (resp.state.from_script && resp.state.from_script==false)) return {...resp,...{ valid:false }};
                //code
                if (node.text_note != '') resp.open = `//${node.text_note}\n`;
                resp.open += `else {\n`;
                resp.close = `}\n`;
                return resp;
            }
        },

        //*def_condicion_view
        //*def_otra_condicion_view
        //*def_condicion (def_script_condicion)
        //*def_otra_condicion (def_script_otra_condicion)


        // *************
        // 	 VARIABLES
        // *************

        'def_variables': {
            x_icons: 'xmag',
            x_level: 3,
            x_text_contains: 'variables',
            hint: 'Definicion local de variables observadas',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                let params = {};
                // process attributes as variables
                // set vars
                if (typeof state.current_page !== 'undefined') {
                    if (typeof context.x_state.pages[state.current_page] === 'undefined') context.x_state.pages[state.current_page] = {};
                    if ('variables' in context.x_state.pages[state.current_page] === false) context.x_state.pages[state.current_page].variables = {};
                    if ('types' in context.x_state.pages[state.current_page] === false) context.x_state.pages[state.current_page].types = {};
                }
                return resp;
            }
        },

        'def_variables_field': {
            x_priority: 1,
            x_empty: 'icons',
            x_level: '>3',
            x_all_hasparent: 'def_variables',
            hint: 'Campo con nombre de variable observada y tipo',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                if (resp.state.vars_path) resp.state.vars_last_level = resp.state.vars_path.length;
                //console.log('FIRST CALL var state',resp.state );
                let params = {},
                    tmp = {
                        type: 'string',
                        field: node.text.trim(),
                        level: node.level - 3
                    };
                //
                if ((tmp.field.contains('[') && tmp.field.contains(']')) ||
                    (tmp.field.contains('{') && tmp.field.contains('}'))) {
                    // this is a script node
                    tmp.type = 'script';
                    tmp.field = `script${node.id}`;

                } else if (tmp.field.contains(':')) {
                    tmp.type = tmp.field.split(':').pop().toLowerCase().trim(); //listlast
                    tmp.field = tmp.field.split(':')[0].trim();
                } else if (node.nodes_raw && node.nodes_raw.length > 0) {
                    // get children nodes, and test that they don't have a help icon.
                    let subnodes = await node.getNodes();
                    let has_event = false;
                    for (let i of subnodes) {
                        if (i.icons.includes('help')) {
                            has_event = true;
                        }
                    }
                    if (has_event == false) {
                        tmp.type = 'object';
                    }
                } else {
                    tmp.type = 'string';
                }
                // process attributes (and overwrite types if needed)
                Object.keys(node.attributes).map(function(keym) {
                    let keytest = keym.toLowerCase().trim();
                    let value = node.attributes[keym];
                    //console.log(`${tmp.field} attr key:${keytest}, value:${value}`);
                    if ('type,tipo,:type,:tipo'.split(',').includes(keytest)) {
                        tmp.type = value.toLowerCase().trim();
                    } else if ('valor,value,:valor,:value'.split(',').includes(keytest)) {
                        let t_value = value.replaceAll('$variables', 'this.')
                            .replaceAll('$vars.', 'this.')
                            .replaceAll('$params.', 'this.')
                            .replaceAll('$config.', 'process.env.')
                            .replaceAll('$store.', 'this.$store.state.');
                        if (t_value.toLowerCase().trim() == '{now}') t_value = 'new Date()';
                        if (t_value.contains('assets:')) {
                            t_value = context.getAsset(t_value, 'js');
                        }
                        params.value = t_value;
                    } else {
                        if (keytest.contains(':')) {
                            params[keym.trim()] = value.trim();
                        }
                    }
                });
                // assign default value for type, if not defined
                if ('string,text,texto'.split(',').includes(tmp.type)) {
                    if ('value' in params === false) {
                        params.value = '';
                    } else {
                        params.value = params.value.toString();
                    }
                } else if ('script' == tmp.type) {
                    params.value = node.text.trim().replaceAll('&#xa;', '')
                        .replaceAll('&apos;', '"')
                        .replaceAll('&#xf1;', 'ñ');
                    if (params.value.charAt(0) != '[') {
                        params.value = '[' + params.value + ']';
                    }
                    let convertjs = require('safe-eval');
                    try {
                        params.value = convertjs(params.value);
                    } catch (cjerr) {
                        params.value = [{
                            error_in_script_var: cjerr
                        }];
                    }
                    //params.value = JSON.parse('['+params.value+']');

                } else if ('int,numeric,number,numero'.split(',').includes(tmp.type)) {
                    if ('value' in params === false) {
                        params.value = 0;
                    } else {
                        params.value = parseInt(params.value);
                    }
                } else if ('float,real,decimal'.split(',').includes(tmp.type)) {
                    if ('value' in params === false) {
                        params.value = 0.0;
                    } else {
                        params.value = parseFloat(params.value);
                    }
                } else if ('boolean,boleano,booleano'.split(',').includes(tmp.type)) {
                    if ('value' in params === false) {
                        if (tmp.field == 'true') {
                            // ex value of an array (true/false)
                            params.value = true;
                        } else if (tmp.field == 'false') {
                            params.value = false;
                        } else {
                            params.value = false;
                        }
                    } else {
                        if (params.value == 'true') {
                            // ex value of an array (true/false)
                            params.value = true;
                        } else if (params.value == 'false') {
                            params.value = false;
                        }
                    }
                } else if ('array'.split(',').includes(tmp.type)) {
                    tmp.type = 'array';
                    if ('value' in params === false) {
                        params.value = [];
                    } else {
                        params.value = JSON.parse(params.value);
                    }

                } else if ('struct,object'.split(',').includes(tmp.type)) {
                    tmp.type = 'object';
                    if ('value' in params === false) {
                        params.value = {};
                    } else {
                        params.value = JSON.parse(params.value);
                    }
                }
                // check and prepare global state
                if (typeof state.current_page !== 'undefined') {
                    if (state.current_page in context.x_state.pages === false) context.x_state.pages[state.current_page] = {};
                    if ('variables' in context.x_state.pages[state.current_page] === false) context.x_state.pages[state.current_page].variables = {};
                    if ('var_types' in context.x_state.pages[state.current_page] === false) context.x_state.pages[state.current_page].var_types = {};
                }
                // assign var info to page state
                if (tmp.level == 1) {
                    // this is a single variable (no dad); eq. variables[field] = value/children
                    context.x_state.pages[state.current_page].var_types[tmp.field] = tmp.type;
                    context.x_state.pages[state.current_page].variables[tmp.field] = params.value;
                    resp.state.vars_path = [tmp.field];
                    resp.state.vars_types = [tmp.type];
                    resp.state.vars_last_level = tmp.level;
                } else {
                    // variables[prev_node_text][current_field] = value
                    //console.log(`testing ${tmp.level} (current level) with ${resp.state.vars_last_level} (last var level)`);
                    if (tmp.level>resp.state.vars_last_level) {
                        //current is son of prev
                        //console.log(`current var '${tmp.field}' (${tmp.level}) is SON of '${resp.state.vars_path.join('.')}' (${resp.state.vars_last_level})`);
                        resp.state.vars_path.push(tmp.field); // push new var to paths
                        resp.state.vars_types.push(tmp.type);
                        //console.log(`trying to set: ${resp.state.vars_path.join('.')} on context.x_state.pages['${state.current_page}'].variables as ${tmp.type}`);

                    } else if (tmp.level==resp.state.vars_last_level) {
                        //current is brother of prev
                        //console.log(`current var '${tmp.field}' (${tmp.level}) is BROTHER of '${resp.state.vars_path.join('.')}' (${resp.state.vars_last_level})`);
                        resp.state.vars_path.pop(); // remove last field from var path
                        resp.state.vars_types.pop(); // remove last field type from vars_types
                        //console.log(`vars_path AFTER pop: `,resp.state.vars_path);
                        resp.state.vars_path.push(tmp.field); // push new var to paths
                        resp.state.vars_types.push(tmp.type);
                        //console.log(`trying to set: ${resp.state.vars_path.join('.')} on context.x_state.pages['${state.current_page}'].variables as ${tmp.type}`);

                    } else {
                        //current path is smaller than last
                        //console.log(`current var '${tmp.field}' (${tmp.level}) is UPPER of '${resp.state.vars_path.join('.')}' (${resp.state.vars_last_level})`);
                        //console.log(`new var has higher hierarchy than last! ${resp.state.vars_last_level} > ${tmp.level}`);
                        let amount=new Array(resp.state.vars_last_level-tmp.level+1);
                        for (let t of amount) {
                            //console.log(`vars_path before pop: `,resp.state.vars_path);
                            resp.state.vars_path.pop(); // remove last field from var path
                            resp.state.vars_types.pop(); // remove last field type from vars_types
                        }
                        //console.log(`vars_path AFTER pops: `,resp.state.vars_path);
                        resp.state.vars_path.push(tmp.field); // push new var to paths
                        resp.state.vars_types.push(tmp.type);
                        //console.log(`trying to set: ${resp.state.vars_path.join('.')} on context.x_state.pages['${state.current_page}'].variables as ${tmp.type}`);
                    }
                    //console.log('MY DAD TYPE:'+resp.state.vars_types[resp.state.vars_types.length - 2]);
                    if (resp.state.vars_types[resp.state.vars_types.length - 2] == 'object') {
                        // dad was an object
                        //console.log('dad was an object',resp.state.vars_types[resp.state.vars_types.length-1]);
                        setToValue(context.x_state.pages[state.current_page].variables, params.value, resp.state.vars_path.join('.'));
                    } else if (resp.state.vars_types[resp.state.vars_types.length - 2] == 'array') {
                        //console.log('dad was an array',resp.state.vars_types[resp.state.vars_types.length-1]);
                        // dad is an array.. 
                        let copy_dad = [...resp.state.vars_path];
                        copy_dad.pop();
                        //console.log('my dad path is '+copy_dad.join('.'));
                        let daddy = getVal(context.x_state.pages[state.current_page].variables, copy_dad.join('.'));
                        //console.log('daddy says:',daddy);
                        if (tmp.type == 'script') {
                            // if we are a script node, just push our values, and not ourselfs.
                            params.value.map(i => {
                                daddy.push(i);
                            });
                        } else if (tmp.field != params.value) {
                            // push as object (array of objects)
                            let tmpi = {};
                            tmpi[tmp.field] = params.value;
                            daddy.push(tmpi);
                        } else {
                            // push just the value (single value)
                            daddy.push(params.value);
                        }
                        // re-set daddy with new value
                        setToValue(context.x_state.pages[state.current_page].variables, daddy, copy_dad.join('.'));
                    }
                    //*resp.state.vars_types.push(tmp.type); // push new var type to vars_types
                    context.x_state.pages[state.current_page].var_types[resp.state.vars_path.join('.')] = tmp.type;
                    resp.state.vars_last_level = resp.state.vars_path.length;
                    //console.log('BEFORE close: state for next var (cur level: '+tmp.level+', last_level:'+resp.state.vars_last_level+')',resp.state);
                    //resp.state.vars_last_level = tmp.level;
                }
                return resp;
            }
        },

        'def_variables_watch': {
            x_icons: 'help',
            x_level: '>4',
            x_text_contains: 'change',
            x_all_hasparent: 'def_variables',
            hint: 'Monitorea los cambios realizados a la variable padre',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                let params = {
                    name: node.text.trim(),
                    type: 'watched',
                    oldvar: 'old',
                    newvar: 'new'
                };
                // process attributes
                Object.keys(node.attributes).map(function(keym) {
                    let keytest = keym.toLowerCase().trim();
                    let value = node.attributes[keym];
                    if (':old,old'.split(',').includes(keytest)) {
                        params.oldvar = value;
                    } else if (':new,new'.split(',').includes(keytest)) {
                        params.newvar = value;
                    } else if (':deep,deep'.split(',').includes(keytest)) {
                        params.deep = value;
                    }
                });
                params.flat = resp.state.vars_path.join('.'); // inherit parent var from def_variables_field last state
                // write tag
                resp.open = context.tagParams('vue_watched_var', params, false);
                if (node.text_note != '') resp.open += `//${node.text_note}\n`;
                resp.close = '</vue_watched_var>';
                return resp;
            }
        },

        'def_variables_func': {
            x_icons: 'help',
            x_level: 4,
            x_not_text_contains: ':server,condicion si,otra condicion',
            x_all_hasparent: 'def_variables',
            hint: 'Variable tipo funcion',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                let params = {
                    name: node.text.trim(),
                    type: 'computed'
                };
                let tmp = {
                    type: 'async'
                };
                // process attributes
                Object.keys(node.attributes).map(function(key) {
                    let keytest = key.toLowerCase().trim().replaceAll(':', '');
                    let value = node.attributes[key].trim();
                    if ('default' == keytest) {
                        params.valor = value;
                    } else if ('valor,value'.split(',').includes(keytest)) {
                        params.valor = value;
                    } else if ('lazy' == keytest) {
                        params.lazy = (value == 'true') ? true : false;
                    } else if ('observar,onchange,cambie,cambien,modifiquen,cuando,monitorear,watch'.split(',').includes(keytest)) {
                        params.watch = value;
                    } else if ('async' == keytest) {
                        tmp.type = (value == 'true') ? 'async' : 'sync';
                    }
                });
                // built response
                if (tmp.type == 'async') {
                    // add async plugin to app
                    context.x_state.plugins['vue-async-computed'] = {
                        global: true,
                        npm: {
                            'vue-async-computed': '*'
                        }
                    };
                    resp.open = context.tagParams('vue_async_computed', params, false);
                    if (node.text_note != '') resp.open += `//${node.text_note}\n`;
                    resp.close = '</vue_async_computed>\n';
                } else {
                    resp.open = context.tagParams('vue_computed', params, false);
                    if (node.text_note != '') resp.open += `//${node.text_note}\n`;
                    resp.close = '</vue_computed>\n';
                }
                resp.state.from_script=true;
                // return
                return resp;
            }
        },

        // *************************
        //  Scriptable definitions
        // *************************

        //..scripts..
        'def_responder': {
            x_icons: 'desktop_new',
            x_text_pattern: `responder "*"`,
            x_all_hasparent: 'def_variables',
            x_level: '>3',
            hint: 'Emite una respuesta para la variable de tipo funcion',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                if (node.text_note != '') resp.open = `//${node.text_note}\n`;
                let text = context.dsl_parser.findVariables({
                    text: node.text,
                    symbol: `"`,
                    symbol_closing: `"`
                });
                // tests return types
                if (text.contains('**') && node.icons.includes('bell')) {
                    let new_vars = getTranslatedTextVar(text);
                    resp.open += `return ${new_vars};\n`;
                } else if (text.contains('$')) {
                    text = text.replaceAll('$params.', 'this.')
                        .replaceAll('$variables.', 'this.');
                    resp.open += `return ${text};\n`;
                } else if (text.contains('assets:')) {
                    text = context.getAsset(text, 'js');
                    resp.open += `return ${text};\n`;
                } else if (text == '') {
                    resp.open += `return '';\n`;
                } else if (text.charAt(0) == '(' && text.slice(-1) == ')') {
                    text = text.slice(1).slice(0, -1);
                    resp.open += `return ${text};\n`;
                } else {
                    if (context.x_state.central_config.idiomas && context.x_state.central_config.idiomas.contains(',')) {
                        // @TODO add support for i18m
                    } else {
                        resp.open += `return '${text}';\n`;
                    }
                }
                return resp;
            }
        },

        'def_struct': {
            x_icons: 'desktop_new',
            x_text_contains: 'struct,,',
            x_not_text_contains: 'traducir',
            x_level: '>3',
            hint: 'Crea una variable de tipo Objeto, con los campos y valores definidos en sus atributos.',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                let tmp = {};
                // parse output var
                tmp.var = node.text.split(',').pop(); //last comma element
                if (resp.state.from_server) { // if (context.hasParentID(node.id, 'def_event_server')==true) {
                    tmp.var = tmp.var.replaceAll('$variables.', 'resp.')
                        .replaceAll('$vars.', 'resp.')
                        .replaceAll('$params.', 'resp.');
                    tmp.var = (tmp.var == 'resp.') ? 'resp' : tmp.var;
                    tmp.parent_server = true;
                } else {
                    tmp.var = tmp.var.replaceAll('$variables.', 'this.')
                        .replaceAll('store.', 'this.$store.state.');
                    tmp.var = (tmp.var == 'this.') ? 'this' : tmp.var;
                }
                // process attributes
                let attrs = {...node.attributes
                };
                Object.keys(node.attributes).map(function(key) {
                    let keytest = key.toLowerCase().trim();
                    let value = node.attributes[key].trim();
                    if (node.icons.includes('bell') && value.contains('**')) {
                        value = getTranslatedTextVar(value,true);
                    } else if (value.contains('assets:')) {
                        value = context.getAsset(value, 'js');
                    } else {
                        // normalize vue type vars
                        if (tmp.parent_server==true) {
                            value = value.replaceAll('$variables.', 'resp.')
                                .replaceAll('$vars.', 'resp.')
                                .replaceAll('$params.', 'resp.');
                        } else {
                            value = value.replaceAll('$variables.', 'this.')
                                .replaceAll('$vars.', 'this.')
                                .replaceAll('$params.', 'this.')
                                .replaceAll('$store.', 'this.$store.state.');
                        }
                    }
                    attrs[key] = value; //.replaceAll('{now}','new Date()');
                });
                // write output
                if (resp.state.as_object) {
                    resp.open = context.jsDump(attrs).replaceAll("'`","`").replaceAll("`'","`");
                    delete resp.state.as_object;
                } else {
                    if (node.text_note != '') resp.open = `// ${node.text_note}\n`;
                    resp.open += `let ${tmp.var.trim()} = ${context.jsDump(attrs).replaceAll("'`","`").replaceAll("`'","`")};\n`;
                }
                return resp;
            }
        },

        'def_extender': {
            x_level: '>3',
            x_text_pattern: `extender "*"`,
            x_icons: 'desktop_new',
            hint: 'Extiende los atributos de un objeto con los datos dados en los atributos.',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                // create obj from current node as js obj
                resp = await context.x_commands['def_struct'].func(node, { ...state, ...{
                    as_object:true
                }});
                delete resp.state.as_object;
                // get var name
                let tmp = {};
                tmp.var = context.dsl_parser.findVariables({
                    text: node.text,
                    symbol: '"',
                    symbol_closing: '"'
                }).trim();
                // clean given varname $variables, etc.
                if (resp.state.from_server) { //if (context.hasParentID(node.id, 'def_event_server')==true) {
                    tmp.var = tmp.var.replaceAll('$variables.', 'resp.')
                                     .replaceAll('$vars.', 'resp.').replaceAll('$params.', 'resp.');
                    tmp.var = (tmp.var == 'resp.') ? 'resp' : tmp.var;
                } else {
                    tmp.var = tmp.var.replaceAll('$variables.', 'this.').replaceAll('store.', 'this.$store.state.');
                    tmp.var = (tmp.var == 'this.') ? 'this' : tmp.var;
                }
                // extend given var with 'extend_node' content
                tmp.nobj = resp.open;
                if (node.text_note != '') resp.open = `// ${node.text_note}\n`;
                resp.open = `${tmp.var} = {...${tmp.var},...${tmp.nobj}};\n`;
                return resp;
            }
        },

        'def_literal_js': {
            x_icons: 'penguin',
            x_not_text_contains: 'por cada registro en',
            x_level: '>1',
            hint: 'Nodo JS literal; solo traduce $variables y referencias de refrescos a metodos async.',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                let tmp = { text:node.text };
                if (node.text.contains('$variables.') && node.text.right(2)=='()') {
                    tmp.text = tmp.text .replaceAll('$variables.','this.$asyncComputed.')
                                        .replaceAll('()','.update();')
                                        .replaceAll(';;',';');
                } else if (node.text.contains('$vars.') && node.text.right(2)=='()') {
                    tmp.text = tmp.text .replaceAll('$vars.','this.$asyncComputed.')
                                        .replaceAll('()','.update();')
                                        .replaceAll(';;',';');
                } else if (node.text.contains('$params.') && node.text.right(2)=='()') {
                    //@TODO check this, doesn't look right
                    tmp.text = tmp.text .replaceAll('$params.','this.$asyncComputed.')
                                        .replaceAll('()','.update();')
                                        .replaceAll(';;',';');
                } else if (node.text.contains('$store.') && node.text.contains('this.$store.state')==false) {
                    tmp.text = tmp.text .replaceAll('$store.','this.$store.state.')
                                        .replaceAll('this.$nuxt.this.$store.','this.$nuxt.$store.');
                } else {
                    tmp.text = tmp.text .replaceAll('$variables.','this.')
                                        .replaceAll('$vars.','this.')
                                        .replaceAll('$params.','this.')
                                        .replaceAll('$config.','process.env.');
                }
                //scrollTo plugin?
                if (tmp.text.contains('this.$scrollTo')) {
                    context.plugins['vue-scrollto'] = {
                        global:true,
                        npm: {
                            'vue-scrollto': '*'
                        }
                    };
                }
                //vuescript2
                if (tmp.text.contains('vuescript2')) tmp.text = tmp.text.replaceAll('vuescript2.',`require('vue-script2').`);
                //underscore
                if (tmp.text.contains('_.')) {
                    context.x_state.pages[resp.state.current_page].imports['underscore'] = '_';
                }
                //code
                if (node.text_note != '') resp.open = `// ${node.text_note.trim()}\n`;
                resp.open += tmp.text;
                if (resp.open.right(1)!=';') resp.open += ';';
                resp.open += '\n';
                return resp;
            }
        },

        'def_console': {
            x_icons: 'clanbomber',
            x_not_icons: 'desktop_new',
            x_level: '>1',
            hint: 'Emite su texto a la consola. Soporta mostrar los datos/variables de sus atributos.',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                let tmp = { text:node.text };
                if (node.icons.includes('bell')) {
                    tmp.text = getTranslatedTextVar(tmp.text);
                } else {
                    tmp.text = `'${tmp.text}'`;
                }
                //attr
                // process attributes
                let attrs = {...node.attributes
                };
                Object.keys(node.attributes).map(function(key) {
                    let keytest = key.toLowerCase().trim();
                    let value = node.attributes[key].trim();
                    let valuet = getTranslatedTextVar(value);
                    if (value.contains('assets:')) {
                        value = context.getAsset(value, 'jsfunc');
                    } else {
                        // normalize vue type vars                        
                        value = value.replaceAll('$variables.', 'this.')
                            .replaceAll('$vars.', 'this.')
                            .replaceAll('$params.', 'this.')
                            .replaceAll('$store.', 'this.$store.state.');
                    }
                    //bell
                    if (node.icons.includes('bell') && value.replaceAll('**','')!=valuet) { // && value!=`**${valuet}**`) {
                        value = getTranslatedTextVar(value);
                    } else if (!node.icons.includes('bell') && value.contains('**')) {
                        value = `'${value}'`;
                    }
                    // modify values to copy
                    attrs[key] = value;
                });
                //code
                if (node.text_note != '') resp.open = `// ${node.text_note.trim()}\n`;
                resp.open += `console.log(${tmp.text},${context.jsDump(attrs)});\n`;
                return resp;
            }
        },

        'def_npm_instalar': {
            x_icons: 'desktop_new',
            x_text_pattern: `npm:+(install|instalar) "*"`,
            x_level: '>2',
            hint: 'Instala el paquete npm indicado entrecomillas y lo instancia en la página (import:true) o función actual, o lo asigna a la variable indicada luego de la coma.',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                let defaults = { text:node.text, tipo:'import', tipo_:'', version:'*', git:'', init:'' };
                let attr = aliases2params('def_npm_instalar', node);  
                attr = {...defaults, ...attr};
                if (attr.import && attr.import!='true') attr.tipo_ = attr.import;
                attr.text = context.dsl_parser.findVariables({
                    text: node.text,
                    symbol: '"',
                    symbol_closing: '"'
                }).trim();
                attr.var = attr.tipo_ = node.text.split(',').pop();
                //code
                context.x_state.npm[attr.text] = attr.version;
                if (node.text_note != '') resp.open = `// ${node.text_note.trim()}\n`;
                if (!attr.require) {
                    if ('current_func' in resp.state) {
                        context.x_state.functions[resp.state.current_func].imports[attr.text] = attr.tipo_;
                    } else {
                        context.x_state.pages[resp.state.current_page].imports[attr.text] = attr.tipo_;
                    }
                } else {
                    resp.open += `let ${attr.var} = require('${attr.text}');\n`;
                }
                return resp;
            }
        },

        'def_crear_id_unico': {
            x_icons: 'desktop_new',
            x_text_contains: 'crear id unico,,', //,,=requires comma
            x_level: '>2',
            hint: 'Obtiene un id unico (en 103 trillones) y lo asigna a la variable luego de la coma.',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                let tmp = { var:node.text.split(',').pop() };
                //code
                if (node.text_note != '') resp.open = `// ${node.text_note.trim()}\n`;
                context.x_state.npm['nanoid']='2.1.1';
                resp.open += `let ${tmp.var} = require('nanoid')();\n`;
                return resp;
            }
        },

        'def_aftertime': {
            x_icons: 'desktop_new',
            x_text_pattern: `ejecutar en "*" +(segundos|minutos|horas)`,
            x_level: '>2',
            hint: 'Ejecuta su contenido desfasado en los segundos especificados.',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                let time = context.dsl_parser.findVariables({
                    text: node.text,
                    symbol: `"`,
                    symbol_closing: `"`
                }).trim();
                //code
                let amount = node.text.split(' ').pop();
                if (amount=='minutos') time += `*60`;
                if (amount=='horas') time += `*60*60`;
                if (node.text_note != '') resp.open = `// ${node.text_note.trim()}\n`;
                resp.open += `setTimeout(function q() {\n`;
                resp.close = `}.bind(this), 1000*${time});\n`;
                return resp;
            }
        },

        'def_probar': {
            x_icons: 'broken-line',
            x_text_exact: 'probar',
            x_level: '>2',
            hint: 'Encapsula sus hijos en un try/catch.',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                //test if there is an error node child
                let subnodes = await node.getNodes();
                let has_error = false;
                subnodes.map(async function(item) {
                    if (item.text=='error' && item.icons.includes('help')) has_error=true;
                }.bind(this));
                //code
                if (node.text_note != '') resp.open = `// ${node.text_note.trim()}\n`;
                resp.open += 'try {\n';
                if (has_error==false) {
                    resp.close += `} catch(e${node.id}) {\n console.log('error en comando probar: recuerda usar evento ?error como hijo para controlarlo.');\n`;
                }
                resp.close += '}';
                return resp;
            }
        },

        'def_probar_error': {
            x_icons: 'help',
            x_text_exact: 'error',
            x_all_hasparent: 'def_probar',
            x_level: '>2',
            hint: 'Ejecuta sus hijos si ocurre un error en el nodo padre.',
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                //code
                resp.open += `} catch(e${node.id}) {\n`;
                resp.open += `let error = e${node.id};\n`;
                if (node.text_note != '') resp.open += `// ${node.text_note.trim()}\n`;
                return resp;
            }
        },

        'def_insertar_modelo': {
            x_icons: 'desktop_new',
            x_text_pattern: `insertar modelo "*"`,
            x_level: '>2',
            hint:  `Inserta los atributos (campos) y sus valores en el modelo indicado entrecomillas. 
                    Si especifica una variable luego de la coma, asigna el resultado de la nueva insercion en esa variable.`,
            func: async function(node, state) {
                let resp = context.reply_template({
                    state
                });
                let tmp = { var:'', data:{}, model:'' };
                if (node.text.contains(',')) tmp.var=node.text.split(',').pop();
                tmp.model = context.dsl_parser.findVariables({
                    text: node.text,
                    symbol: `"`,
                    symbol_closing: `"`
                }).trim();
                //get attributes and values as struct
                tmp.data = (await context.x_commands['def_struct'].func(node, { ...state, ...{
                    as_object:true
                }})).open;
                //code
                if (node.text_note != '') resp.open += `// ${node.text_note.trim()}\n`;
                resp.open += `this.alasql('INSERT INTO ${tmp.model} VALUES ?', [${tmp.data}]);\n`;
                return resp;
            }
        },

        //*def_responder (@todo i18n)
        //**def_insertar_modelo (@todo test it after adding support for events)
        //def_consultar_modelo
        //def_modificar_modelo
        //def_eliminar_modelo
        //def_consultar_web
        //def_consultar_web_upload
        //def_consultar_web_download
        //*def_aftertime
        //*def_struct
        //*def_extender
        //*def_npm_instalar
        //def_agregar_campos
        //def_preguntar
        //def_array_transformar
        //def_procesar_imagen
        //def_imagen_exif
        //def_var_clonar
        //def_modificar
        //*def_probar
        //*def_probar_error (ex.def_event_try)
        //*def_literal_js
        //def_guardar_nota
        //*def_console
        //def_xcada_registro
        //*def_crear_id_unico
        //def_enviarpantalla

        // OTHER node types
        /*'def_imagen': {
        	x_icons:'idea',
        	x_not_icons:'button_cancel,desktop_new,help',
        	x_not_empty:'attributes[:src]',
        	x_empty:'',
        	x_level:'>2',
        	func:async function(node,state) {
        		return context.reply_template({ otro:'Pablo', state });
        	}
        },*/

        //
    }
};

//private helper methods
function setObjectKeys(obj, value) {
    let resp = obj;
    if (typeof resp === 'string') {
        resp = {};
        let keys = obj.split(',');
        for (let i in keys) {
            resp[keys[i]] = value;
        }
    } else {
        for (let i in resp) {
            resp[i] = value;
        }
    }
    return resp;
}

function setToValue(obj, value, path) {
    var i;
    path = path.split('.');
    for (i = 0; i < path.length - 1; i++)
        obj = obj[path[i]];

    obj[path[i]] = value;
}

function getVal(project, myPath) {
    return myPath.split('.').reduce((res, prop) => res[prop], project);
}