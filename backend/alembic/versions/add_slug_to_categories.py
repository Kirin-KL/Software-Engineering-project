"""add slug to categories

Revision ID: add_slug_to_categories
Revises: 
Create Date: 2024-03-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_slug_to_categories'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Добавляем колонку slug
    op.add_column('categories', sa.Column('slug', sa.String(), nullable=True))
    
    # Создаем индекс для slug
    op.create_index(op.f('ix_categories_slug'), 'categories', ['slug'], unique=True)
    
    # Заполняем slug на основе name (транслитерация и приведение к нижнему регистру)
    op.execute("""
        UPDATE categories 
        SET slug = LOWER(
            TRANSLATE(
                name,
                'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
                'ABVGDEYOZHZIJKLMNOPRSTUFHTSCHSHCHYEYUYA'
            )
        )
    """)
    
    # Делаем slug обязательным полем
    op.alter_column('categories', 'slug',
               existing_type=sa.String(),
               nullable=False)

def downgrade() -> None:
    # Удаляем индекс
    op.drop_index(op.f('ix_categories_slug'), table_name='categories')
    
    # Удаляем колонку slug
    op.drop_column('categories', 'slug') 