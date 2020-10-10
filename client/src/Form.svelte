<script>
  function submit() {
    alert("Thanks!");
  }
</script>

<style>
  .outerbox {
    width: 500px;
    height: 700px;
    display: flex;
    flex-direction: column;
  }
  .name-input {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    margin: 2%;
    padding: 2%;
    border-radius: 10px;
  }
  .phone-input {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    flex-grow: 1;
    margin: 2%;
    padding: 2%;
    border-radius: 10px;
  }
  .birthday-input {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    margin: 2%;
    padding: 2%;
    border-radius: 10px;
  }
  .email-input {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    margin: 2%;
    padding: 2%;
    border-radius: 10px;
  }
  .donation-date {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    margin: 2%;
    padding: 2%;
    border-radius: 10px;
  }
  .address-input {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    margin: 2%;
    padding: 2%;
    border-radius: 10px;
  }
  .pincode-input {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    margin: 2%;
    padding: 2%;
    border-radius: 10px;
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
  }
  .submit-input {
    display: flex;
    border-radius: 10px;
    align-items: center;
    justify-content: center;
  }
</style>

<div class="outerbox">
  Name: <input
    type="text"
    class="name-input"
    placeholder="Enter your full name"
    required /> Phone Number : <input type="number" class="phone-input" required />
  <label for="birthday">Birthday:</label>
  <input type="date" class="birthday-input" name="birthday" /> Email: <input
    type="email"
    class="email-input"
    placeholder="Enter your Email ID" />
  <label for="Donation date">Donation date:</label>
  <input type="date" class="donation-date" required /> Address: <input
    type="text"
    class="address-input" />
  Pincode: <input type="number" class="pincode-input" placeholder="Pincode" />

  <div class="payment">
    Payment: <input
      type="radio"
      name="payment"
      class="payment-input"
      value="Cash" /> Cash <input
      type="radio"
      name="payment"
      class="payment-input"
      value="Cheque" /> Cheque <input
      type="radio"
      name="payment"
      class="payment-input"
      value="Online"
      required /> Online
  </div>
  Amount <input type="number" class="amount-input" placeholder="Rs." required />
  <label for="dropdown" class="period-input">Choose a period:</label>
  <select name="dropdown">
    <option value="one">One-time Payment</option>
    <option value="three">3 Months</option>
    <option value="six">6 Months</option>
    <option value="twelve">12 Months</option>
  </select>

  <button on:click={submit} class="submit-input" placeholder="submit">Submit
  </button>
</div>
