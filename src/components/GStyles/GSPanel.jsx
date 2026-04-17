import React, { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { PackagePlus } from "lucide-react";

const GSPanel = ({ selectedGS, setSelectedGS, gs, setGs }) => {
  // Estado para almacenar los estilos globales

  // Estado para el nombre del nuevo estilo
  const [newStyleName, setNewStyleName] = useState("");

  // Función para manejar el cambio en el campo del formulario (nombre del estilo)
  const handleChange = (e) => {
    setNewStyleName(e.target.value);
  };

  // Función para agregar un nuevo estilo global
  const handleAddStyle = () => {
    if (newStyleName) {
      setGs((prev) => [
        ...prev,
        {
          name: newStyleName,
          styles: {
            color: "",
            cursor: "",
            backgroundColor: "",
            background: "",
            opacity: "",
            border: "",
            borderWidth: "",
            borderColor: "",
            borderStyle: "",
            fontSize: "",
            fontFamily: "",
            fontWeight: "",
            lineHeight: "",
            textAlign: "",
            width: "",
            maxWidth: "",
            height: "",
            maxHeight: "",
            display: "",
            flexDirection: "",
            alignItems: "", // Valor predeterminado
            justifyContent: "", // Valor predeterminado
            gap: "",
            outline: "",
            position: "",
            overflow: "",
            boxShadow: "",
            top: "",
            bottom: "",
            left: "",
            right: "",
            transform: "",
            transition: "",
            margin: "",
            marginTop: "",
            marginBottom: "",
            marginLeft: "",
            marginRight: "",
            padding: "",
            paddingTop: "",
            paddingBottom: "",
            paddingLeft: "",
            paddingRight: "",
            borderRadius: "",
            borderTopLeftRadius: "",
            borderTopRightRadius: "",
            borderBottomLeftRadius: "",
            borderBottomRightRadius: "",
          }, // Estilos iniciales
        },
      ]);
      setNewStyleName(""); // Resetear formulario
    }
  };

  const handleGSClick = (element) => {
    // Aquí puedes manejar el clic en un estilo global
    setSelectedGS(element);
    console.log(element);
    console.log(gs);
  };

  return (
    <div className="col-span-3 justify-center items-center bg-gray-100 rounded-lg shadow-md relative">
      <div className="w-full h-16 bg-[#2B2B44] px-4 flex items-center justify-between">
        <h3 className="text-white text-lg font-medium">Estilos Globales</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <PackagePlus /> Crear Estilo Global
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crear nuevo estilo global</DialogTitle>
              <DialogDescription>
                Añade un estilo global a tu proyecto
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={newStyleName}
                  onChange={handleChange}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleAddStyle}>
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className=" w-full h-full p-4 grid grid-cols-5 gap-4 overflow-y-auto">
          {gs.map((style, index) => (
            <div
              key={index}
              className="py-4 px-6 rounded-lg bg-blue-500 hover:bg-blue-600 cursor-pointer text-lg text-white h-10 flex items-center justify-center"
              onClick={() => handleGSClick(style)}
            >
              {style.name}
            </div>
          ))}
      </div>
      {/* Mostrar los estilos globales creados */}
    </div>
  );
};

export default GSPanel;
