function AccountForm({
  accountNumberInput,
  setAccountNumberInput,
  selectedAction,
  setSelectedAction,
  setSelectedAccountNumber,
}) {
  const handleAccountNumberChange = (e) => {
    setAccountNumberInput(e.target.value);
    setSelectedAccountNumber(e.target.value);
  };

  return (
    <div className="account-form">
      <input
        type="text"
        value={accountNumberInput}
        onChange={handleAccountNumberChange}
        placeholder="Enter Account Number"
        className="input-field"
      />
      <select
        value={selectedAction}
        onChange={(e) => setSelectedAction(e.target.value)}
        className="select-field"
      >
        <option value="">Select Action</option>
        <option value="deposit">Deposit</option>
        <option value="withdraw">Withdraw</option>
        <option value="checkBalance">Check Balance</option>
      </select>
    </div>
  );
}

export default AccountForm;
