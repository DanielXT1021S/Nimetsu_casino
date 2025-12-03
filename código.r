# Ejercicio 1: Importa un archivo CSV y muestra sus primeras 10 filas.

print("------------------------------------------- Medio ----------------------------------------------------------------")
print("Ejercicios 1 -------------------------\n")

data(mtcars)
write.csv(mtcars, "archivo.csv", row.names = TRUE)
datos1 <- read.csv("archivo.csv")
head(datos1, 10)


print("Ejercicios 2 -------------------------\n")
# Ejercicio 2: Remplaza valores perdidos en una columna numérica por la media

data(mtcars)
datos2 <- mtcars
datos2$hp[c(2, 5, 8, 11, 14)] <- NA
media_hp <- mean(datos2$hp, na.rm = TRUE)
datos2$hp[is.na(datos2$hp)] <- media_hp
head(datos2, 10)

# Ejercicio 3: Estandariza una variable numérica.

print("Ejercicios 3 -------------------------\n")

data(mtcars)
datos3 <- mtcars
datos3$mpg_estandarizado <- scale(datos3$mpg)
head(datos3, 10)

# Ejercicio 4: Crea una nueva variable en mtcars que sea el cociente hp/wt.

print("Ejercicios 4 -------------------------\n")

data(mtcars)
mtcars$hp_wt <- mtcars$hp / mtcars$wt
head(mtcars, 10)

# Ejercicio 5: Ordena iris por Sepal.Length de mayor a menor.

print("Ejercicios 5 -------------------------\n")

data(iris)
iris_ordenado <- iris[order(iris$Sepal.Length, decreasing = TRUE), ]
head(iris_ordenado, 10)

print("Ejercicios 6 -------------------------\n")

# Ejercicio 6: Filtra mtcars para autos con mpg > 20 y cyl == 6.

data(mtcars)
mtcars_filtrado <- mtcars[mtcars$mpg > 20 & mtcars$cyl == 6, ]
mtcars_filtrado

# Ejercicio 7: Selecciona solo las columnas numéricas en iris
print("Ejercicios 7 -------------------------\n")

data(iris)
iris_numerico <- iris[, sapply(iris, is.numeric)]
head(iris_numerico, 10)

# Ejercicio 8: Calcula la media de Sepal.Length por especie usando aggregate().

print("Ejercicios 8 -------------------------\n")

data(iris)
media_por_especie <- aggregate(Sepal.Length ~ Species, data = iris, FUN = mean)
media_por_especie

# Ejercicio 9: Obtén el valor máximo de wt en mtcars y la fila correspondiente.

print("Ejercicios 9 -------------------------\n")

data(mtcars)
max_wt <- max(mtcars$wt)
fila_max_wt <- mtcars[mtcars$wt == max_wt, ]
fila_max_wt

# Ejercicio 10: Crea un resumen estadístico de mtcars usando summary().

print("------------------------------------------- AVANZADOS ----------------------------------------------------------------")

print("Ejercicios 10 -------------------------\n")

data(mtcars)
summary(mtcars)

# Ejercicio 11: Ajusta un modelo lineal mpg ~ hp + wt usando mtcars.

print("Ejercicios 11 -------------------------\n")

data(mtcars)
modelo <- lm(mpg ~ hp + wt, data = mtcars)
summary(modelo)

# Ejercicio 12: Realiza un boxplot de Sepal.Length separado por especies.

print("Ejercicios 12 -------------------------\n")

data(iris)
boxplot(Sepal.Length ~ Species, data = iris, main = "Sepal Length por Especie", xlab = "Especie", ylab = "Sepal Length")

# Ejercicio 13: Calcula una regresión polinómica de grado 2 entre hp y mpg.

print("Ejercicios 13 -------------------------\n")

data(mtcars)
modelo_poly <- lm(mpg ~ poly(hp, 2), data = mtcars)
summary(modelo_poly)

# Ejercicio 14: Aplica k-means con k=3 a iris[,1:4].

print("Ejercicios 14 -------------------------\n")

data(iris)
set.seed(123)
kmeans_resultado <- kmeans(iris[, 1:4], centers = 3)
kmeans_resultado

# Ejercicio 15: Genera una gráfica de densidad de mpg en mtcars.

print("Ejercicios 15 -------------------------\n")

data(mtcars)
plot(density(mtcars$mpg), main = "Densidad de MPG", xlab = "MPG", ylab = "Densidad")

# Ejercicio 16: Realiza una prueba t comparando Sepal.Length entre dos especies.

print("Ejercicios 16 -------------------------\n")

data(iris)
setosa <- iris[iris$Species == "setosa", "Sepal.Length"]
versicolor <- iris[iris$Species == "versicolor", "Sepal.Length"]
t_test <- t.test(setosa, versicolor)
t_test

# Ejercicio 17: Estandariza mtcars completo y calcula distancias euclidianas.

print("Ejercicios 17 -------------------------\n")

data(mtcars)
mtcars_escalado <- scale(mtcars)
distancias <- dist(mtcars_escalado, method = "euclidean")
head(as.matrix(distancias))

# Ejercicio 18: Usando tidyverse, filtra autos con mpg >25 y hp <100.

print("Ejercicios 18 -------------------------\n")

library(dplyr)

data(mtcars)
mtcars_filtrado18 <- mtcars %>%
  filter(mpg > 25, hp < 100)

mtcars_filtrado18

# Ejercicio 19: Crea un gráfico de líneas del dataset pressure.

print("Ejercicios 19 -------------------------\n")

data(pressure)
plot(pressure$temperature, pressure$pressure, type = "l",
     main = "Presión vs Temperatura", xlab = "Temperatura", ylab = "Presión")

# Ejercicio 20: Realiza una tabla resumen con media, sd, min y max por especie en iris.

print("Ejercicios 20 -------------------------\n")

data(iris)
resumen <- aggregate(. ~ Species, data = iris,
                     FUN = function(x) c(media = mean(x),
                                         sd = sd(x),
                                         min = min(x),
                                         max = max(x)))
resumen