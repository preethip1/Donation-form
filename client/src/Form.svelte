<script>
  function submit() {
    alert("Thanks!");
  }
</script>

<div class="name">
  Name <input type="text" placeholder="Enter your full name" />
</div>
<div class="phone-number">Phone Number <input type="number" /></div>
<div class="email">
  Email <input type="email" placeholder="Enter your Email ID" />
</div>
<div class="address">Address <input type="text" /></div>
<div class="pincode">Pincode <input type="number" placeholder="Pincode" /></div>
<div class="payment">
  Payment: <input type="radio" name="payment" value="Cash" /> Cash <input
    type="radio"
    name="payment"
    value="Cheque" /> Cheque <input
    type="radio"
    name="payment"
    value="Online payment" /> Online Payment
</div>
<div class="amount">Amount <input type="number" placeholder="Rs." /></div>
<div class="submit">
  <button on:click={submit} placeholder="submit">Submit </button>
</div>
