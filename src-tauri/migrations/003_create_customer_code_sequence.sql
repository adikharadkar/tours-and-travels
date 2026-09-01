CREATE TABLE IF NOT EXISTS customer_code_sequence (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    next_number INTEGER NOT NULL
);

INSERT OR IGNORE INTO customer_code_sequence (id, next_number)
VALUES (1, 1);