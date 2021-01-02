<script>
  let name;
  let phoneNo;
  let smirtiDate;
  let email;
  let donationDate;
  let address;
  let pincode;
  let payment;
  let amount;
  let period;
  import { db } from "./firebase";
  import { collectionData } from "rxfire/firestore";
  import { startWith } from "rxjs/operators";
  import { dataset_dev } from "svelte/internal";
  import axios from "axios";

  async function submit() {
    let data = {
      name,
      phoneNo,
      smirtiDate,
      email,
      donationDate,
      address,
      pincode,
      payment,
      amount,
      period: parseInt(period),
    };
    let res = await axios.post(
      "http://localhost:3000/api/donation/details",
      data
    );
    console.log(res);
    if (res.status == 200) {
      alert("Thanks for submition");
      location.reload();
    } else {
      alert("Something went wrong, Retry");
      // location.reload();
    }
  }
</script>

<style>
  .outerbox {
    width: 500px;
    height: 700px;
    display: flex;
    flex-direction: column;
    margin: 80px;
  }
  .name-input {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    margin: 2%;
    padding: 2%;
    border-radius: 10px;
    margin-bottom: 25px;
  }
  .phone-input {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    flex-grow: 1;
    margin: 2%;
    padding: 2%;
    border-radius: 10px;
    margin-bottom: 25px;
  }
  .birthday-input {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    margin: 2%;
    padding: 2%;
    border-radius: 10px;
    margin-bottom: 25px;
  }
  .email-input {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    margin: 2%;
    padding: 2%;
    border-radius: 10px;
    margin-bottom: 25px;
  }
  .donation-date {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    margin: 2%;
    padding: 2%;
    border-radius: 10px;
    margin-bottom: 25px;
  }
  .address-input {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    margin: 2%;
    padding: 2%;
    border-radius: 10px;
    margin-bottom: 25px;
  }
  .pincode-input {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    margin: 2%;
    padding: 2%;
    border-radius: 10px;
    margin-bottom: 25px;
  }
  .payment,
  .payment-input {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    margin: 2%;
    padding: 2%;
    border-radius: 10px;
  }
  .amount-input {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    margin: 2%;
    padding: 2%;
    border-radius: 10px;
  }
  .period-input {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    margin: 2%;
    padding: 2%;
    border-radius: 10px;
    margin-bottom: 25px;
  }
  .submit-input {
    display: flex;
    border-radius: 10px;
    align-items: center;
    justify-content: center;
    margin-top: 40px;
    background-color: #46a4e8;
  }
  h3 {
    margin-left: 25px;
    margin-top: 30px;
  }
</style>

<div class="outerbox">
  Name:
  <input
    bind:value={name}
    type="text"
    class="name-input"
    placeholder="Enter your full name"
    required />
  Phone Number :
  <input bind:value={phoneNo} type="number" class="phone-input" required />
  <label for="birthday">Smirti Date:</label>
  <input
    bind:value={smirtiDate}
    type="date"
    class="birthday-input"
    name="birthday" />
  Email:
  <input
    bind:value={email}
    type="email"
    class="email-input"
    placeholder="Enter your Email ID" />
  <label for="Donation date">Donation date:</label>
  <input bind:value={donationDate} type="date" class="donation-date" required />
  Address:
  <input bind:value={address} type="text" class="address-input" />
  Pincode:
  <input
    bind:value={pincode}
    type="number"
    class="pincode-input"
    placeholder="Pincode" />

  <div class="payment">
    Payment:
    <input
      bind:group={payment}
      type="radio"
      name="payment"
      class="payment-input"
      value="Cash" />
    Cash
    <input
      bind:group={payment}
      type="radio"
      name="payment"
      class="payment-input"
      value="Cheque" />
    Cheque
    <input
      type="radio"
      bind:group={payment}
      name="payment"
      class="payment-input"
      value="Online"
      required />
    Online
  </div>
  Amount
  <input
    bind:value={amount}
    type="number"
    class="amount-input"
    placeholder="Rs."
    required />
  <label for="dropdown" class="period-input">Choose a period:</label>
  <select bind:value={period} name="dropdown">
    <option value="-1">One-time Payment</option>
    <option value="3">3 Months</option>
    <option value="6">6 Months</option>
    <option value="12">12 Months</option>
  </select>

  <button on:click={submit} class="submit-input" placeholder="submit">Submit
  </button>
  <h3>Thank You! Your Support is greatly appreciated!</h3>
</div>
