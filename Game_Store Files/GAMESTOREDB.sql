create database GAMESTOREDB;

use GAMESTOREDB;

--User table:
CREATE TABLE [dbo].[User] (
    [User_ID] INT IDENTITY(1,1) NOT NULL,
    [User_Name] NVARCHAR(100) NOT NULL,
    [Email] NVARCHAR(100) NOT NULL,
    [Password] NVARCHAR(100) NOT NULL,
    [Role] NVARCHAR(20) NOT NULL DEFAULT 'Customer',
    [Date_Created] DATETIME NULL DEFAULT GETDATE(),
    
    CONSTRAINT PK_User PRIMARY KEY CLUSTERED ([User_ID]),
    CONSTRAINT UQ_User_Email UNIQUE NONCLUSTERED ([Email]),
    CONSTRAINT CHK_User_Role CHECK ([Role] IN ('Admin', 'Customer'))
);
INSERT INTO [dbo].[User] ([User_Name], [Email], [Password], [Role])
VALUES ('RafayBaig', 'abdurrafaybaig1212@gmail.com', 'rafay1234', 'Customer');


--Game table:
CREATE TABLE [dbo].[Game] (
    [Game_ID] INT IDENTITY(1,1) NOT NULL,
    [Name] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(MAX) NULL,
    [Price] DECIMAL(10, 2) NOT NULL,
    [Genre] NVARCHAR(50) NULL,
    [Platform] NVARCHAR(50) NULL,
    [ImageData] NVARCHAR(300) NULL,
    [Release_Date] DATE NULL,
    [Featured] BIT NULL DEFAULT 0,

    CONSTRAINT PK_Game PRIMARY KEY CLUSTERED ([Game_ID]),
    CONSTRAINT CHK_Game_Price CHECK ([Price] >= 0)
);
--Inventory table:
CREATE TABLE [dbo].[Inventory] (
    [Game_ID] INT NOT NULL,
    [Last_Updated] DATETIME NULL DEFAULT GETDATE(),
    [Admin_ID] INT NOT NULL,

    CONSTRAINT PK_Inventory PRIMARY KEY CLUSTERED ([Game_ID]),
    CONSTRAINT FK_Inventory_Game FOREIGN KEY ([Game_ID]) REFERENCES [dbo].[Game]([Game_ID]),
    CONSTRAINT FK_Inventory_Admin FOREIGN KEY ([Admin_ID]) REFERENCES [dbo].[User]([User_ID])
);
--Shopping_cart:
CREATE TABLE [dbo].[Shopping_Cart] (
    [Cart_ID] INT IDENTITY(1,1) NOT NULL,
    [User_ID] INT NOT NULL,
    [Created] DATETIME NULL DEFAULT GETDATE(),

    CONSTRAINT PK_Shopping_Cart PRIMARY KEY CLUSTERED ([Cart_ID]),
    CONSTRAINT FK_ShoppingCart_User FOREIGN KEY ([User_ID]) REFERENCES [dbo].[User]([User_ID])
);
--Cart_item:
CREATE TABLE [dbo].[Cart_Item] (
    [Cart_ID] INT NOT NULL,
    [Game_ID] INT NOT NULL,
    [Price] DECIMAL(10, 2) NOT NULL,

    CONSTRAINT PK_CartItem PRIMARY KEY CLUSTERED ([Cart_ID], [Game_ID]),
    CONSTRAINT FK_CartItem_Cart FOREIGN KEY ([Cart_ID]) REFERENCES [dbo].[Shopping_Cart]([Cart_ID]),
    CONSTRAINT FK_CartItem_Game FOREIGN KEY ([Game_ID]) REFERENCES [dbo].[Game]([Game_ID]),
    CONSTRAINT CHK_CartItem_Price CHECK ([Price] >= 0)
);
--Order:
CREATE TABLE [dbo].[Order] (
    [Order_ID] INT IDENTITY(1,1) NOT NULL,
    [User_ID] INT NOT NULL,
    [Order_Date] DATETIME NOT NULL DEFAULT GETDATE(),
    [Total_Amount] DECIMAL(10, 2) NOT NULL,
    [Status] NVARCHAR(20) NOT NULL,

    CONSTRAINT PK_Order PRIMARY KEY CLUSTERED ([Order_ID]),
    CONSTRAINT FK_Order_User FOREIGN KEY ([User_ID]) REFERENCES [dbo].[User]([User_ID]),
    CONSTRAINT CHK_Order_Status CHECK (
        [Status] IN ('Cancelled', 'Delivered', 'Shipped', 'Processing', 'Pending')
    ),
    CONSTRAINT CHK_Order_Amount CHECK ([Total_Amount] >= 0)
);
--Order_details:
CREATE TABLE [dbo].[Order_Details] (
    [Order_ID] INT NOT NULL,
    [Game_ID] INT NOT NULL,
    [Price] DECIMAL(10, 2) NOT NULL,

    CONSTRAINT PK_OrderDetails PRIMARY KEY CLUSTERED ([Order_ID], [Game_ID]),
    CONSTRAINT FK_OrderDetails_Order FOREIGN KEY ([Order_ID]) REFERENCES [dbo].[Order]([Order_ID]),
    CONSTRAINT FK_OrderDetails_Game FOREIGN KEY ([Game_ID]) REFERENCES [dbo].[Game]([Game_ID]),
    CONSTRAINT CHK_OrderDetails_Price CHECK ([Price] >= 0)
);
--Payment:
CREATE TABLE [dbo].[Payment] (
    [Payment_ID] INT IDENTITY(1,1) NOT NULL,
    [Order_ID] INT NOT NULL,
    [Payment_Date] DATETIME NOT NULL DEFAULT GETDATE(),
    [Payment_Method] NVARCHAR(50) NOT NULL,
    [Amount] DECIMAL(10, 2) NOT NULL,
    [IBAN] NVARCHAR(20) NOT NULL,

    CONSTRAINT PK_Payment PRIMARY KEY CLUSTERED ([Payment_ID]),
    CONSTRAINT FK_Payment_Order FOREIGN KEY ([Order_ID]) REFERENCES [dbo].[Order]([Order_ID]),
    CONSTRAINT CHK_Payment_Amount CHECK ([Amount] >= 0),
    CONSTRAINT CHK_Payment_Method CHECK (
        [Payment_Method] IN ('Other', 'Bank Transfer', 'PayPal', 'Credit Card')
    )
);
