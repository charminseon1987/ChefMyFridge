-- 향후 PostgreSQL 연동 시 사용할 스키마

CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    quantity DECIMAL,
    unit VARCHAR(20),
    added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    location VARCHAR(50) -- 냉장/냉동/실온
);

CREATE TABLE IF NOT EXISTS expiry_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name VARCHAR(100) NOT NULL UNIQUE,
    base_days INTEGER,
    storage VARCHAR(50),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    ingredients TEXT[], -- 배열
    cooking_time VARCHAR(50),
    difficulty VARCHAR(20),
    calories INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_item_name ON inventory(item_name);
CREATE INDEX IF NOT EXISTS idx_expiry_item_name ON expiry_info(item_name);
CREATE INDEX IF NOT EXISTS idx_recipes_title ON recipes(title);
