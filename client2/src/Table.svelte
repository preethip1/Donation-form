<script>
  import { onMount } from "svelte";
  let data = [];
  import axios from "axios";

  onMount(async () => {
    let res = await axios.get("http://localhost:3000/api/donation/list");
    if (res.status == 200) {
      // alert("Thanks for submition");
      data = res.data.list;
      console.log(data);
      // location.reload();
    } else {
      alert("Something went wrong, Retry");
      // location.reload();
    }
  });
</script>

<style>
  table {
    font-family: arial, sans-serif;
    border-collapse: collapse;
    width: 75%;
    margin-left: 50px;
  }

  td,
  th {
    border: 1px solid #dddddd;
    text-align: left;
    padding: 8px;
  }
</style>

<table>
  <tr>
    <th>Name</th>
    <th>Phone Number</th>
    <th>Smirti Date</th>
    <th>Email</th>
    <th>Donation date</th>
    <th>Address</th>
    <th>Pincode</th>
    <th>Payment</th>
    <th>Amount</th>
    <th>Period</th>
  </tr>
  {#each data as d}
    <tr>
      <td>{d.name || 'NA'}</td>
      <td>{d.phoneNo || 'NA'}</td>
      <td>
        {d.smirtiDate ? `${new Date(d.smirtiDate).getDate()} - ${new Date(d.smirtiDate).getMonth()} - ${new Date(d.smirtiDate).getFullYear()} ` : 'NA'}
      </td>
      <td>{d.email || 'NA'}</td>
      <td>
        {d.donationDate ? `${new Date(d.donationDate).getDate()} - ${new Date(d.donationDate).getMonth()} - ${new Date(d.donationDate).getFullYear()} ` : 'NA'}
      </td>
      <td>{d.address || 'NA'}</td>
      <td>{d.pincode || 'NA'}</td>
      <td>{d.payment || 'NA'}</td>
      <td>{d.amount || 'NA'}</td>
      <td>{d.period || 'NA'}</td>
    </tr>
  {/each}
</table>
