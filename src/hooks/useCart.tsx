import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data } = await api.get<Stock>(`stock/${productId}`);

      const productExistsInCart = cart.find(
        product => product.id === productId
      );

      const amount = productExistsInCart ? productExistsInCart.amount + 1 : 1;

      if (amount > data.amount) {
        toast.error("Quantidade solicitada fora de estoque");

        return;
      }
      if (productExistsInCart) {
        const newProducts = cart.map(product => {
          if (product.id === productId) {
            return {
              ...product,
              amount: product.amount + 1
            };
          }
          return product;
        });
        setCart(newProducts);

        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newProducts));
        return;
      }

      const response = await api.get<Product>(`products/${productId}`);
      const newProducts = [
        ...cart,
        {
          ...response.data,
          amount: 1
        }
      ];
      setCart(newProducts);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newProducts));
    } catch (err) {
      console.log(err);
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExistsInCart = cart.find(
        product => product.id === productId
      );
      if (productExistsInCart) {
        const productsInCart = cart.filter(product => product.id !== productId);

        setCart(productsInCart);
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify(productsInCart)
        );
      } else {
        throw new Error("Produto não encontrado no carrinho");
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount
  }: UpdateProductAmount) => {
    try {
      const { data } = await api.get<Stock>(`stock/${productId}`);

      if (amount < 1) {
        throw new Error("Alteraçáo inválida");
      }

      if (amount > data.amount) {
        toast.error("Quantidade solicitada fora de estoque");

        return;
      }
      const newProducts = cart.map(product => {
        if (productId === product.id) {
          return {
            ...product,
            amount: amount
          };
        }
        return product;
      });
      setCart(newProducts);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newProducts));
      return;
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
