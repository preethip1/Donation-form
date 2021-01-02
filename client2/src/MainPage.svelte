<script>
    import Form from "./Form.svelte";
    import Table from "./Table.svelte";
    export let menu = 1;
</script>

<style>
    
    ul#menu li {
        display: inline;
        margin: 50px;
    }
    h1 {
        margin: 80px;
    }
</style>

<main>
    <h1>DONATION FORM</h1>
    <ul id="menu">
        <li><a href="/" on:click|preventDefault={() => (menu = 1)}>Form</a></li>
        |
        <li>
            <a href="/" on:click|preventDefault={() => (menu = 2)}>Today's
                Reminder</a>
        </li>
    </ul>

    {#if menu === 1}
        <Form />
    {:else if menu === 2}
        <Table />
    {:else}
        <h1>Page Not Found</h1>
    {/if}
</main>
