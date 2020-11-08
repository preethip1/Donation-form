
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
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
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
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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
    	let div1;
    	let t0;
    	let input0;
    	let t1;
    	let input1;
    	let t2;
    	let label0;
    	let t4;
    	let input2;
    	let t5;
    	let input3;
    	let t6;
    	let label1;
    	let t8;
    	let input4;
    	let t9;
    	let input5;
    	let t10;
    	let input6;
    	let t11;
    	let div0;
    	let t12;
    	let input7;
    	let t13;
    	let input8;
    	let t14;
    	let input9;
    	let t15;
    	let t16;
    	let input10;
    	let t17;
    	let label2;
    	let t19;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let t24;
    	let button;
    	let t26;
    	let h3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			t0 = text("Name: ");
    			input0 = element("input");
    			t1 = text(" Phone Number : ");
    			input1 = element("input");
    			t2 = space();
    			label0 = element("label");
    			label0.textContent = "Birthday:";
    			t4 = space();
    			input2 = element("input");
    			t5 = text(" Email: ");
    			input3 = element("input");
    			t6 = space();
    			label1 = element("label");
    			label1.textContent = "Donation date:";
    			t8 = space();
    			input4 = element("input");
    			t9 = text(" Address: ");
    			input5 = element("input");
    			t10 = text("\n  Pincode: ");
    			input6 = element("input");
    			t11 = space();
    			div0 = element("div");
    			t12 = text("Payment: ");
    			input7 = element("input");
    			t13 = text(" Cash ");
    			input8 = element("input");
    			t14 = text(" Cheque ");
    			input9 = element("input");
    			t15 = text(" Online");
    			t16 = text("\n  Amount ");
    			input10 = element("input");
    			t17 = space();
    			label2 = element("label");
    			label2.textContent = "Choose a period:";
    			t19 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "One-time Payment";
    			option1 = element("option");
    			option1.textContent = "3 Months";
    			option2 = element("option");
    			option2.textContent = "6 Months";
    			option3 = element("option");
    			option3.textContent = "12 Months";
    			t24 = space();
    			button = element("button");
    			button.textContent = "Submit";
    			t26 = space();
    			h3 = element("h3");
    			h3.textContent = "Thank You! Your Support is greatly appreciated!";
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "name-input svelte-t1m0xx");
    			attr_dev(input0, "placeholder", "Enter your full name");
    			input0.required = true;
    			add_location(input0, file, 128, 8, 2130);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "class", "phone-input svelte-t1m0xx");
    			input1.required = true;
    			add_location(input1, file, 132, 31, 2246);
    			attr_dev(label0, "for", "birthday");
    			add_location(label0, file, 133, 2, 2301);
    			attr_dev(input2, "type", "date");
    			attr_dev(input2, "class", "birthday-input svelte-t1m0xx");
    			attr_dev(input2, "name", "birthday");
    			add_location(input2, file, 134, 2, 2343);
    			attr_dev(input3, "type", "email");
    			attr_dev(input3, "class", "email-input svelte-t1m0xx");
    			attr_dev(input3, "placeholder", "Enter your Email ID");
    			add_location(input3, file, 134, 70, 2411);
    			attr_dev(label1, "for", "Donation date");
    			add_location(label1, file, 138, 2, 2502);
    			attr_dev(input4, "type", "date");
    			attr_dev(input4, "class", "donation-date svelte-t1m0xx");
    			input4.required = true;
    			add_location(input4, file, 139, 2, 2554);
    			attr_dev(input5, "type", "text");
    			attr_dev(input5, "class", "address-input svelte-t1m0xx");
    			add_location(input5, file, 139, 64, 2616);
    			attr_dev(input6, "type", "number");
    			attr_dev(input6, "class", "pincode-input svelte-t1m0xx");
    			attr_dev(input6, "placeholder", "Pincode");
    			add_location(input6, file, 142, 11, 2679);
    			attr_dev(input7, "type", "radio");
    			attr_dev(input7, "name", "payment");
    			attr_dev(input7, "class", "payment-input svelte-t1m0xx");
    			input7.value = "Cash";
    			add_location(input7, file, 145, 13, 2785);
    			attr_dev(input8, "type", "radio");
    			attr_dev(input8, "name", "payment");
    			attr_dev(input8, "class", "payment-input svelte-t1m0xx");
    			input8.value = "Cheque";
    			add_location(input8, file, 149, 27, 2887);
    			attr_dev(input9, "type", "radio");
    			attr_dev(input9, "name", "payment");
    			attr_dev(input9, "class", "payment-input svelte-t1m0xx");
    			input9.value = "Online";
    			input9.required = true;
    			add_location(input9, file, 153, 31, 2993);
    			attr_dev(div0, "class", "payment svelte-t1m0xx");
    			add_location(div0, file, 144, 2, 2750);
    			attr_dev(input10, "type", "number");
    			attr_dev(input10, "class", "amount-input svelte-t1m0xx");
    			attr_dev(input10, "placeholder", "Rs.");
    			input10.required = true;
    			add_location(input10, file, 160, 9, 3132);
    			attr_dev(label2, "for", "dropdown");
    			attr_dev(label2, "class", "period-input svelte-t1m0xx");
    			add_location(label2, file, 161, 2, 3206);
    			option0.__value = "one";
    			option0.value = option0.__value;
    			add_location(option0, file, 163, 4, 3305);
    			option1.__value = "three";
    			option1.value = option1.__value;
    			add_location(option1, file, 164, 4, 3355);
    			option2.__value = "six";
    			option2.value = option2.__value;
    			add_location(option2, file, 165, 4, 3399);
    			option3.__value = "twelve";
    			option3.value = option3.__value;
    			add_location(option3, file, 166, 4, 3441);
    			attr_dev(select, "name", "dropdown");
    			add_location(select, file, 162, 2, 3276);
    			attr_dev(button, "class", "submit-input svelte-t1m0xx");
    			attr_dev(button, "placeholder", "submit");
    			add_location(button, file, 169, 2, 3498);
    			attr_dev(h3, "class", "svelte-t1m0xx");
    			add_location(h3, file, 171, 2, 3587);
    			attr_dev(div1, "class", "outerbox svelte-t1m0xx");
    			add_location(div1, file, 127, 0, 2099);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t0);
    			append_dev(div1, input0);
    			append_dev(div1, t1);
    			append_dev(div1, input1);
    			append_dev(div1, t2);
    			append_dev(div1, label0);
    			append_dev(div1, t4);
    			append_dev(div1, input2);
    			append_dev(div1, t5);
    			append_dev(div1, input3);
    			append_dev(div1, t6);
    			append_dev(div1, label1);
    			append_dev(div1, t8);
    			append_dev(div1, input4);
    			append_dev(div1, t9);
    			append_dev(div1, input5);
    			append_dev(div1, t10);
    			append_dev(div1, input6);
    			append_dev(div1, t11);
    			append_dev(div1, div0);
    			append_dev(div0, t12);
    			append_dev(div0, input7);
    			append_dev(div0, t13);
    			append_dev(div0, input8);
    			append_dev(div0, t14);
    			append_dev(div0, input9);
    			append_dev(div0, t15);
    			append_dev(div1, t16);
    			append_dev(div1, input10);
    			append_dev(div1, t17);
    			append_dev(div1, label2);
    			append_dev(div1, t19);
    			append_dev(div1, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(select, option3);
    			append_dev(div1, t24);
    			append_dev(div1, button);
    			append_dev(div1, t26);
    			append_dev(div1, h3);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", submit, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
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

    /* src/Table.svelte generated by Svelte v3.25.1 */

    const file$1 = "src/Table.svelte";

    function create_fragment$1(ctx) {
    	let table;
    	let tr0;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let th2;
    	let t5;
    	let tr1;
    	let td0;
    	let t7;
    	let td1;
    	let t9;
    	let td2;
    	let t11;
    	let tr2;
    	let td3;
    	let t13;
    	let td4;
    	let t15;
    	let td5;
    	let t17;
    	let tr3;
    	let td6;
    	let t19;
    	let td7;
    	let t21;
    	let td8;
    	let t23;
    	let tr4;
    	let td9;
    	let t25;
    	let td10;
    	let t27;
    	let td11;
    	let t29;
    	let tr5;
    	let td12;
    	let t31;
    	let td13;
    	let t33;
    	let td14;
    	let t35;
    	let tr6;
    	let td15;
    	let t37;
    	let td16;
    	let t39;
    	let td17;

    	const block = {
    		c: function create() {
    			table = element("table");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "Column 1";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "Column 2";
    			t3 = space();
    			th2 = element("th");
    			th2.textContent = "Column 3";
    			t5 = space();
    			tr1 = element("tr");
    			td0 = element("td");
    			td0.textContent = "1";
    			t7 = space();
    			td1 = element("td");
    			td1.textContent = "2";
    			t9 = space();
    			td2 = element("td");
    			td2.textContent = "3";
    			t11 = space();
    			tr2 = element("tr");
    			td3 = element("td");
    			td3.textContent = "1";
    			t13 = space();
    			td4 = element("td");
    			td4.textContent = "2";
    			t15 = space();
    			td5 = element("td");
    			td5.textContent = "3";
    			t17 = space();
    			tr3 = element("tr");
    			td6 = element("td");
    			td6.textContent = "1";
    			t19 = space();
    			td7 = element("td");
    			td7.textContent = "2";
    			t21 = space();
    			td8 = element("td");
    			td8.textContent = "3";
    			t23 = space();
    			tr4 = element("tr");
    			td9 = element("td");
    			td9.textContent = "1";
    			t25 = space();
    			td10 = element("td");
    			td10.textContent = "2";
    			t27 = space();
    			td11 = element("td");
    			td11.textContent = "3";
    			t29 = space();
    			tr5 = element("tr");
    			td12 = element("td");
    			td12.textContent = "1";
    			t31 = space();
    			td13 = element("td");
    			td13.textContent = "2";
    			t33 = space();
    			td14 = element("td");
    			td14.textContent = "3";
    			t35 = space();
    			tr6 = element("tr");
    			td15 = element("td");
    			td15.textContent = "1";
    			t37 = space();
    			td16 = element("td");
    			td16.textContent = "2";
    			t39 = space();
    			td17 = element("td");
    			td17.textContent = "3";
    			attr_dev(th0, "class", "svelte-mo3str");
    			add_location(th0, file$1, 3, 4, 20);
    			attr_dev(th1, "class", "svelte-mo3str");
    			add_location(th1, file$1, 4, 4, 42);
    			attr_dev(th2, "class", "svelte-mo3str");
    			add_location(th2, file$1, 5, 4, 64);
    			add_location(tr0, file$1, 2, 2, 11);
    			attr_dev(td0, "class", "svelte-mo3str");
    			add_location(td0, file$1, 8, 4, 101);
    			attr_dev(td1, "class", "svelte-mo3str");
    			add_location(td1, file$1, 9, 4, 116);
    			attr_dev(td2, "class", "svelte-mo3str");
    			add_location(td2, file$1, 10, 4, 131);
    			add_location(tr1, file$1, 7, 2, 92);
    			attr_dev(td3, "class", "svelte-mo3str");
    			add_location(td3, file$1, 13, 4, 161);
    			attr_dev(td4, "class", "svelte-mo3str");
    			add_location(td4, file$1, 14, 4, 176);
    			attr_dev(td5, "class", "svelte-mo3str");
    			add_location(td5, file$1, 15, 4, 191);
    			add_location(tr2, file$1, 12, 2, 152);
    			attr_dev(td6, "class", "svelte-mo3str");
    			add_location(td6, file$1, 18, 4, 221);
    			attr_dev(td7, "class", "svelte-mo3str");
    			add_location(td7, file$1, 19, 4, 236);
    			attr_dev(td8, "class", "svelte-mo3str");
    			add_location(td8, file$1, 20, 4, 251);
    			add_location(tr3, file$1, 17, 2, 212);
    			attr_dev(td9, "class", "svelte-mo3str");
    			add_location(td9, file$1, 23, 4, 281);
    			attr_dev(td10, "class", "svelte-mo3str");
    			add_location(td10, file$1, 24, 4, 296);
    			attr_dev(td11, "class", "svelte-mo3str");
    			add_location(td11, file$1, 25, 4, 311);
    			add_location(tr4, file$1, 22, 2, 272);
    			attr_dev(td12, "class", "svelte-mo3str");
    			add_location(td12, file$1, 28, 4, 341);
    			attr_dev(td13, "class", "svelte-mo3str");
    			add_location(td13, file$1, 29, 4, 356);
    			attr_dev(td14, "class", "svelte-mo3str");
    			add_location(td14, file$1, 30, 4, 371);
    			add_location(tr5, file$1, 27, 2, 332);
    			attr_dev(td15, "class", "svelte-mo3str");
    			add_location(td15, file$1, 33, 4, 401);
    			attr_dev(td16, "class", "svelte-mo3str");
    			add_location(td16, file$1, 34, 4, 416);
    			attr_dev(td17, "class", "svelte-mo3str");
    			add_location(td17, file$1, 35, 4, 431);
    			add_location(tr6, file$1, 32, 2, 392);
    			attr_dev(table, "class", "svelte-mo3str");
    			add_location(table, file$1, 1, 0, 1);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t1);
    			append_dev(tr0, th1);
    			append_dev(tr0, t3);
    			append_dev(tr0, th2);
    			append_dev(table, t5);
    			append_dev(table, tr1);
    			append_dev(tr1, td0);
    			append_dev(tr1, t7);
    			append_dev(tr1, td1);
    			append_dev(tr1, t9);
    			append_dev(tr1, td2);
    			append_dev(table, t11);
    			append_dev(table, tr2);
    			append_dev(tr2, td3);
    			append_dev(tr2, t13);
    			append_dev(tr2, td4);
    			append_dev(tr2, t15);
    			append_dev(tr2, td5);
    			append_dev(table, t17);
    			append_dev(table, tr3);
    			append_dev(tr3, td6);
    			append_dev(tr3, t19);
    			append_dev(tr3, td7);
    			append_dev(tr3, t21);
    			append_dev(tr3, td8);
    			append_dev(table, t23);
    			append_dev(table, tr4);
    			append_dev(tr4, td9);
    			append_dev(tr4, t25);
    			append_dev(tr4, td10);
    			append_dev(tr4, t27);
    			append_dev(tr4, td11);
    			append_dev(table, t29);
    			append_dev(table, tr5);
    			append_dev(tr5, td12);
    			append_dev(tr5, t31);
    			append_dev(tr5, td13);
    			append_dev(tr5, t33);
    			append_dev(tr5, td14);
    			append_dev(table, t35);
    			append_dev(table, tr6);
    			append_dev(tr6, td15);
    			append_dev(tr6, t37);
    			append_dev(tr6, td16);
    			append_dev(tr6, t39);
    			append_dev(tr6, td17);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
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

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Table", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Table> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Table extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.25.1 */
    const file$2 = "src/App.svelte";

    // (35:4) {:else}
    function create_else_block(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Page Not Found";
    			attr_dev(h1, "class", "svelte-1cwke2q");
    			add_location(h1, file$2, 35, 8, 652);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(35:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (33:25) 
    function create_if_block_1(ctx) {
    	let table;
    	let current;
    	table = new Table({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(table.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(table, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(table.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(table.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(table, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(33:25) ",
    		ctx
    	});

    	return block;
    }

    // (31:4) {#if menu === 1}
    function create_if_block(ctx) {
    	let form;
    	let current;
    	form = new Form({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(form.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(form, target, anchor);
    			current = true;
    		},
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
    			destroy_component(form, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(31:4) {#if menu === 1}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let ul;
    	let li0;
    	let a0;
    	let t3;
    	let li1;
    	let a1;
    	let t5;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block, create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*menu*/ ctx[0] === 1) return 0;
    		if (/*menu*/ ctx[0] === 2) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "DONATION FORM";
    			t1 = space();
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Form";
    			t3 = text("\n        |\n        ");
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Table";
    			t5 = space();
    			if_block.c();
    			attr_dev(h1, "class", "svelte-1cwke2q");
    			add_location(h1, file$2, 19, 4, 280);
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$2, 22, 12, 347);
    			attr_dev(li0, "class", "svelte-1cwke2q");
    			add_location(li0, file$2, 21, 8, 330);
    			attr_dev(a1, "href", "/");
    			add_location(a1, file$2, 26, 12, 460);
    			attr_dev(li1, "class", "svelte-1cwke2q");
    			add_location(li1, file$2, 25, 8, 443);
    			attr_dev(ul, "id", "menu");
    			attr_dev(ul, "class", "svelte-1cwke2q");
    			add_location(ul, file$2, 20, 4, 307);
    			add_location(main, file$2, 18, 0, 269);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t3);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(main, t5);
    			if_blocks[current_block_type_index].m(main, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "click", prevent_default(/*click_handler*/ ctx[1]), false, true, false),
    					listen_dev(a1, "click", prevent_default(/*click_handler_1*/ ctx[2]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(main, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let { menu = 1 } = $$props;
    	const writable_props = ["menu"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, menu = 1);
    	const click_handler_1 = () => $$invalidate(0, menu = 2);

    	$$self.$$set = $$props => {
    		if ("menu" in $$props) $$invalidate(0, menu = $$props.menu);
    	};

    	$$self.$capture_state = () => ({ Form, Table, menu });

    	$$self.$inject_state = $$props => {
    		if ("menu" in $$props) $$invalidate(0, menu = $$props.menu);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [menu, click_handler, click_handler_1];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { menu: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get menu() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set menu(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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
