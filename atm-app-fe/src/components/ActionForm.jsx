function ActionForm({ selectedAction, handleDeposit, handleWithdrawal, checkBalance, depositAmount, setDepositAmount, withdrawAmount, setWithdrawAmount }) {
  switch (selectedAction) {
    case 'deposit':
      return (
        <div className="action-form">
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Deposit Amount"
            className="input-field"
          />
          <button onClick={handleDeposit} className="action-button">Deposit</button>
        </div>
      );
    case 'withdraw':
      return (
        <div className="action-form">
          <input
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="Withdraw Amount"
            className="input-field"
          />
          <button onClick={handleWithdrawal} className="action-button">Withdraw</button>
        </div>
      );
    case 'checkBalance':
      return <button onClick={checkBalance} className="action-button">Check Balance</button>;
    default:
      return null;
  }
}

export default ActionForm;
