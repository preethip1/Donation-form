<script>
  import { onMount, setContext } from "svelte";

  import {
    key as userContextKey,
    initialValue as userContextInitialValue,
  } from "./userContext";
  import axios from "axios";

  import LoginForm from "./LoginForm.svelte";

  onMount(() => {
    setContext(userContextKey, userContextInitialValue);
  });

  const submit = ({ email, password }) =>
    new Promise(async (resolve, reject) => {
      // resolve();
      let res = await axios.post("http://localhost:3000/api/users/login", {
        user: { username: email, password },
      });
      console.log(res);
      if (res.status == 200) {
        // setContext(userContextKey, {
        //     name: "Mukesh",
        //     lastName: "Bar",
        //     email: res.data.username,
        // });
        resolve(res.data);
      } else {
        reject(res.status);
      }
    });
</script>

<style>
</style>

<LoginForm {submit} />
