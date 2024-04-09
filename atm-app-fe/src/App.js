import React, { useEffect, useState } from 'react';
import AccountForm from './components/AccountForm';
import ActionForm from './components/ActionForm';
import MessageDisplay from './components/MessageDisplay';
import './App.css';

function App() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountNumber, setSelectedAccountNumber] = useState('');
  const [accountNumberInput, setAccountNumberInput] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [dailyWithdrawals, setDailyWithdrawals] = useState(() => {
    const saved = localStorage.getItem('dailyWithdrawals');
    const initialValue = JSON.parse(saved);
    return initialValue || {};
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/accounts')
      .then((response) => response.json())
      .then((data) => setAccounts(data))
      .catch((error) => console.error('There was an error!', error));

    const today = new Date().toISOString().slice(0, 10);
    const lastWithdrawalDate = localStorage.getItem('lastWithdrawalDate');
    if (lastWithdrawalDate !== today) {
      setDailyWithdrawals({});
      localStorage.setItem('dailyWithdrawals', JSON.stringify({}));
      localStorage.setItem('lastWithdrawalDate', today);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dailyWithdrawals', JSON.stringify(dailyWithdrawals));
  }, [dailyWithdrawals]);

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    const selectedAccount = accounts.find(
      (account) => account.account_number.toString() === selectedAccountNumber
    );
    const isCreditAccount = selectedAccount?.type === 'credit';
    const accountBalance = selectedAccount?.amount;

    if (amount > 1000) {
      setMessage('Cannot deposit more than $1000 in a single transaction.');
      return;
    }

    if (isCreditAccount && accountBalance < 0 && accountBalance + amount > 0) {
      setMessage(
        'Cannot deposit more in the account than is needed to zero out the account.'
      );
      return;
    }

    try {
      const response = await fetch(
        `/accounts/${selectedAccountNumber}/deposit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ amount }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setMessage(`Deposit Successful: New Balance: ${data.newBalance}`);
        setDepositAmount('');
        refreshAccounts();
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('There was an error processing your deposit', error);
      setMessage('An error occurred while processing your deposit.');
    }
  };

  const handleWithdrawal = async () => {
    const amount = parseFloat(withdrawAmount);
    const selectedAccount = accounts.find(
      (account) => account.account_number.toString() === selectedAccountNumber
    );
    const isCreditAccount = selectedAccount?.type === 'credit';
    const accountBalance = selectedAccount?.amount;
    const creditLimit = selectedAccount?.credit_limit || 0;

    // Rule 1: Single transaction limit of $200
    if (amount > 200) {
      setMessage('Cannot withdraw more than $200 in a single transaction.');
      return;
    }

    // Rule 2: Daily limit of $400 per account
    const accountDailyTotal = dailyWithdrawals[selectedAccountNumber] || 0;
    const newTotal = accountDailyTotal + amount;
    if (newTotal > 400) {
      setMessage(
        'Cannot withdraw more than $400 in a single day for one account.'
      );
      return;
    }

    // Rule 3: Withdrawals must be in multiples of $5
    if (amount % 5 !== 0) {
      setMessage('Can only withdraw amounts in multiples of $5.');
      return;
    }

    // Rule 4: Check for sufficient funds in non-credit accounts
    if (!isCreditAccount && amount > accountBalance) {
      setMessage('Insufficient funds.');
      return;
    }

    // Rule 5: For credit accounts, ensure withdrawal doesn't exceed the credit limit
    if (isCreditAccount && amount > accountBalance + creditLimit) {
      setMessage('Withdrawal exceeds credit limit.');
      return;
    }

    // Attempt to make the withdrawal
    const response = await fetch(
      `/accounts/${selectedAccountNumber}/withdraw`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      }
    );
    const data = await response.json();
    if (response.ok) {
      setMessage(`Withdrawal Successful: New Balance: ${data.newBalance}`);
      setWithdrawAmount('');
      setDailyWithdrawals({
        ...dailyWithdrawals,
        [selectedAccountNumber]: newTotal,
      });
      localStorage.setItem(
        'dailyWithdrawals',
        JSON.stringify({
          ...dailyWithdrawals,
          [selectedAccountNumber]: newTotal,
        })
      );
      refreshAccounts();
    } else {
      setMessage(`Error: ${data.message}`);
    }
  };

  const refreshAccounts = () => {
    fetch('/accounts')
      .then((response) => response.json())
      .then((data) => setAccounts(data))
      .catch((error) =>
        console.error('There was an error refreshing accounts!', error)
      );
  };

  const checkBalance = () => {
    const selectedAccount = accounts.find(
      (account) => account.account_number.toString() === accountNumberInput
    );
    if (selectedAccount) {
      setMessage(`Current Balance: ${selectedAccount.amount}`);
    } else {
      setMessage('Account not found.');
    }
  };

  return (
    <div className="app-container">
      <h1>ATM</h1>
      <AccountForm
        accountNumberInput={accountNumberInput}
        setAccountNumberInput={setAccountNumberInput}
        selectedAction={selectedAction}
        setSelectedAction={setSelectedAction}
        setSelectedAccountNumber={setSelectedAccountNumber}
      />
      <ActionForm
        selectedAction={selectedAction}
        handleDeposit={handleDeposit}
        handleWithdrawal={handleWithdrawal}
        checkBalance={checkBalance}
        depositAmount={depositAmount}
        setDepositAmount={setDepositAmount}
        withdrawAmount={withdrawAmount}
        setWithdrawAmount={setWithdrawAmount}
      />
      <MessageDisplay message={message} />
    </div>
  );
}

export default App;
