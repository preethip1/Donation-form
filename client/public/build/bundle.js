
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.25.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Form.svelte generated by Svelte v3.25.1 */

    const file = "src/Form.svelte";

    function create_fragment(ctx) {
    	let div0;
    	let t0;
    	let input0;
    	let t1;
    	let div1;
    	let t2;
    	let input1;
    	let t3;
    	let div2;
    	let t4;
    	let input2;
    	let t5;
    	let div3;
    	let t6;
    	let input3;
    	let t7;
    	let div4;
    	let t8;
    	let input4;
    	let t9;
    	let div5;
    	let t10;
    	let input5;
    	let t11;
    	let input6;
    	let t12;
    	let input7;
    	let t13;
    	let t14;
    	let div6;
    	let t15;
    	let input8;
    	let t16;
    	let div7;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text("Name ");
    			input0 = element("input");
    			t1 = space();
    			div1 = element("div");
    			t2 = text("Phone Number ");
    			input1 = element("input");
    			t3 = space();
    			div2 = element("div");
    			t4 = text("Email ");
    			input2 = element("input");
    			t5 = space();
    			div3 = element("div");
    			t6 = text("Address ");
    			input3 = element("input");
    			t7 = space();
    			div4 = element("div");
    			t8 = text("Pincode ");
    			input4 = element("input");
    			t9 = space();
    			div5 = element("div");
    			t10 = text("Payment: ");
    			input5 = element("input");
    			t11 = text(" Cash ");
    			input6 = element("input");
    			t12 = text(" Cheque ");
    			input7 = element("input");
    			t13 = text(" Online Payment");
    			t14 = space();
    			div6 = element("div");
    			t15 = text("Amount ");
    			input8 = element("input");
    			t16 = space();
    			div7 = element("div");
    			button = element("button");
    			button.textContent = "Submit";
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Enter your full name");
    			add_location(input0, file, 7, 7, 94);
    			attr_dev(div0, "class", "name");
    			add_location(div0, file, 6, 0, 68);
    			attr_dev(input1, "type", "number");
    			add_location(input1, file, 9, 39, 197);
    			attr_dev(div1, "class", "phone-number");
    			add_location(div1, file, 9, 0, 158);
    			attr_dev(input2, "type", "email");
    			attr_dev(input2, "placeholder", "Enter your Email ID");
    			add_location(input2, file, 11, 8, 255);
    			attr_dev(div2, "class", "email");
    			add_location(div2, file, 10, 0, 227);
    			attr_dev(input3, "type", "text");
    			add_location(input3, file, 13, 29, 348);
    			attr_dev(div3, "class", "address");
    			add_location(div3, file, 13, 0, 319);
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "placeholder", "Pincode");
    			add_location(input4, file, 14, 29, 405);
    			attr_dev(div4, "class", "pincode");
    			add_location(div4, file, 14, 0, 376);
    			attr_dev(input5, "type", "radio");
    			attr_dev(input5, "name", "payment");
    			input5.value = "Cash";
    			add_location(input5, file, 16, 11, 490);
    			attr_dev(input6, "type", "radio");
    			attr_dev(input6, "name", "payment");
    			input6.value = "Cheque";
    			add_location(input6, file, 16, 67, 546);
    			attr_dev(input7, "type", "radio");
    			attr_dev(input7, "name", "payment");
    			input7.value = "Online payment";
    			add_location(input7, file, 19, 29, 618);
    			attr_dev(div5, "class", "payment");
    			add_location(div5, file, 15, 0, 457);
    			attr_dev(input8, "type", "number");
    			attr_dev(input8, "placeholder", "Rs.");
    			add_location(input8, file, 24, 27, 740);
    			attr_dev(div6, "class", "amount");
    			add_location(div6, file, 24, 0, 713);
    			attr_dev(button, "placeholder", "submit");
    			add_location(button, file, 26, 2, 811);
    			attr_dev(div7, "class", "submit");
    			add_location(div7, file, 25, 0, 788);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			append_dev(div0, input0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t2);
    			append_dev(div1, input1);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, t4);
    			append_dev(div2, input2);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, t6);
    			append_dev(div3, input3);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, t8);
    			append_dev(div4, input4);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, t10);
    			append_dev(div5, input5);
    			append_dev(div5, t11);
    			append_dev(div5, input6);
    			append_dev(div5, t12);
    			append_dev(div5, input7);
    			append_dev(div5, t13);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, t15);
    			append_dev(div6, input8);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", submit, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(div5);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(div6);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(div7);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function submit() {
    	alert("Thanks!");
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Form", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Form> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ submit });
    	return [];
    }

    class Form extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Form",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.25.1 */
    const file$1 = "src/App.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let form;
    	let t2;
    	let h3;
    	let current;
    	form = new Form({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "DONATION FORM";
    			t1 = space();
    			create_component(form.$$.fragment);
    			t2 = space();
    			h3 = element("h3");
    			h3.textContent = "Thank You! Your Support is greatly appreciated!";
    			add_location(h1, file$1, 5, 0, 61);
    			add_location(h3, file$1, 7, 0, 94);
    			attr_dev(main, "class", "svelte-yg16s0");
    			add_location(main, file$1, 4, 0, 54);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			mount_component(form, main, null);
    			append_dev(main, t2);
    			append_dev(main, h3);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(form.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(form.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(form);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Form });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
