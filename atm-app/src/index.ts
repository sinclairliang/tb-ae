import express, { Express, Request, Response } from 'express';
import pool from './utils/db';

const app: Express = express();
const port: string | number = process.env.PORT || 8000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to Express & TypeScript Server');
});

app.get('/accounts', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM accounts');
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'No accounts found' });
    } else {
      res.json(result.rows);
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

app.get('/accounts/:accountNumber', async (req: Request, res: Response) => {
  const { accountNumber } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM accounts WHERE account_number = $1',
      [accountNumber]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Account not found' });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

app.get('/accounts/:accountNumber/balance', async (req: Request, res: Response) => {
    const { accountNumber } = req.params;
    try {
      const result = await pool.query('SELECT amount FROM accounts WHERE account_number = $1', [accountNumber]);
      if (result.rows.length > 0) {
        res.json({ balance: result.rows[0].amount });
      } else {
        res.status(404).json({ message: 'Account not found' });
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unknown error occurred' });
      }
    }
  });

  app.post('/accounts/:accountNumber/deposit', async (req: Request, res: Response) => {
    const { accountNumber } = req.params;
    const { amount } = req.body;
    
    if (amount <= 0) {
      return res.status(400).json({ message: 'Deposit amount must be greater than zero' });
    }
  
    try {
      await pool.query('BEGIN');
      const result = await pool.query('UPDATE accounts SET amount = amount + $1 WHERE account_number = $2 RETURNING amount', [amount, accountNumber]);
      
      if (result.rows.length > 0) {
        await pool.query('COMMIT');
        res.json({ message: 'Deposit successful', newBalance: result.rows[0].amount });
      } else {
        await pool.query('ROLLBACK');
        res.status(404).json({ message: 'Account not found' });
      }
    } catch (error) {
      await pool.query('ROLLBACK');
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unknown error occurred' });
      }
    }
  });

  app.post('/accounts/:accountNumber/withdraw', async (req: Request, res: Response) => {
    const { accountNumber } = req.params;
    const { amount } = req.body;
    
    if (amount <= 0) {
      return res.status(400).json({ message: 'Withdrawal amount must be greater than zero' });
    }
  
    try {
      await pool.query('BEGIN');
      const accountResult = await pool.query('SELECT amount FROM accounts WHERE account_number = $1', [accountNumber]);
  
      if (accountResult.rows.length > 0) {
        const currentBalance = accountResult.rows[0].amount;
        if (currentBalance >= amount) {
          const updateResult = await pool.query('UPDATE accounts SET amount = amount - $1 WHERE account_number = $2 RETURNING amount', [amount, accountNumber]);
          await pool.query('COMMIT');
          res.json({ message: 'Withdrawal successful', newBalance: updateResult.rows[0].amount });
        } else {
          await pool.query('ROLLBACK');
          res.status(400).json({ message: 'Insufficient funds' });
        }
      } else {
        await pool.query('ROLLBACK');
        res.status(404).json({ message: 'Account not found' });
      }
    } catch (error) {
      await pool.query('ROLLBACK');
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unknown error occurred' });
      }
    }
  });

app.listen(port, () => {
  console.log(`Server is Fire at http://localhost:${port}`);
});
