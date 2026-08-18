const express = require("express");
const path = require("path");
const fs = require("fs");
const session = require("express-session");
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
    secret: "codealpha-secret",
    resave: false,
    saveUninitialized: true
}));
const PORT = 3000;

// Set EJS as the template engine
app.set("view engine", "ejs");

// Set the views folder
app.set("views", path.join(__dirname, "views"));

// Read products from products.json
const products = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, "data", "products.json"),
        "utf8"
    )
);
let orders = [];
// Home page
app.get("/", (req, res) => {
    res.render("products", { products });
});
app.get("/product/:id", (req, res) => {
    const product = products.find(p => p.id === req.params.id);

    if (!product) {
        return res.status(404).send("Product not found");
    }

    res.render("product-details", { product });
});
app.get("/cart", (req, res) => {
    const cart = req.session.cart || [];

    const total = cart.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);

    res.render("cart", { cart, total });
});
app.post("/cart/add/:id", (req, res) => {
    const product = products.find(p => p.id === req.params.id);

    if (!product) {
        return res.status(404).send("Product not found");
    }

    if (!req.session.cart) {
        req.session.cart = [];
    }

    const existingItem = req.session.cart.find(
        item => item.id === product.id
    );
app.post("/cart/remove/:id", (req, res) => {
    if (req.session.cart) {
        req.session.cart = req.session.cart.filter(
            item => item.id !== req.params.id
        );
    }

    res.redirect("/cart");
});
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        req.session.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }

    res.redirect("/cart");
});
app.post("/cart/update/:id", (req, res) => {
    const cart = req.session.cart || [];

    const item = cart.find(
        item => item.id === req.params.id
    );

    if (!item) {
        return res.status(404).send("Product not found in cart");
    }

    const quantity = parseInt(req.body.quantity);

    if (quantity < 1 || isNaN(quantity)) {
        return res.redirect("/cart");
    }

    item.quantity = quantity;

    res.redirect("/cart");
});
app.get("/checkout", (req, res) => {
    const cart = req.session.cart || [];

    if (cart.length === 0) {
        return res.redirect("/cart");
    }

    const total = cart.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);
app.post("/checkout", (req, res) => {
    const cart = req.session.cart || [];

    if (cart.length === 0) {
        return res.redirect("/cart");
    }

    // Check stock
    for (const item of cart) {
        const product = products.find(p => p.id === item.id);

        if (!product) {
            return res.status(404).send("Product not found");
        }

        if (item.quantity > product.stock) {
            return res.status(400).send(
                `Not enough stock for ${product.name}`
            );
        }
    }

    // Deduct stock
    for (const item of cart) {
        const product = products.find(p => p.id === item.id);
        product.stock -= item.quantity;
    }

    // Calculate total
    const total = cart.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);

    // Create order
    const order = {
        id: "ORD-" + Date.now(),
        name: req.body.name,
        email: req.body.email,
        address: req.body.address,
        items: cart,
        total: total
    };
    orders.push(order);
    // Clear cart after successful order
    req.session.cart = [];

    // Show confirmation
    res.render("order-confirmation", { order });
});
    res.render("checkout", { cart, total });
});
// Start server
app.get("/orders", (req, res) => {
    res.render("orders", { orders });
});
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});