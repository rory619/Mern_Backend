import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';

const BASE_URL = 'https://precartilaginous-sciential-almeda.ngrok-free.dev';

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null); // Hold capture image

  // Function to take photo using device camera
  const takePhoto = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera access to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Keep quality low to avoid huge MongoDB documents
      base64: true, // This is crucial!
    });

    if (!result.canceled) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };


  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/products`, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      Alert.alert('Error', `Could not fetch products. ${err.message}`);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  async function addProduct() {
    if (!name.trim()) return Alert.alert('Validation', 'Name is required');
    const parsedPrice = parseFloat(price);
    if (price && Number.isNaN(parsedPrice)) return Alert.alert('Validation', 'Price must be a number');

    setPosting(true);
    try {
      const body = { name: name.trim(), price: price ? parsedPrice : undefined, description: description.trim(), image: image };

      if (editingId) {
        // Update existing product
        const res = await fetch(`${BASE_URL}/products/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Server: ${res.status} ${text}`);
        }
        setEditingId(null);
        Alert.alert('Success', 'Product updated');
      } else {
        // Create new product
        const res = await fetch(`${BASE_URL}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Server: ${res.status} ${text}`);
        }
        Alert.alert('Success', 'Product added');
      }

      // Clear inputs and refresh list
      setName('');
      setPrice('');
      setDescription('');
      setImage(null); // clear captured photo so Take Photo button returns to default
      await fetchProducts();
    } catch (err) {
      Alert.alert('Error', `Could not save product. ${err.message}`);
    } finally {
      setPosting(false);
    }
  }

  async function deleteProduct(id) {
    const realId = id;
    Alert.alert(
      'Delete product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const res = await fetch(`${BASE_URL}/products/${realId}`, {
                method: 'DELETE',
                headers: { 'ngrok-skip-browser-warning': 'true' },
              });
              if (!res.ok) {
                const text = await res.text();
                throw new Error(`Server: ${res.status} ${text}`);
              }
              await fetchProducts();
              Alert.alert('Deleted', 'Product removed');
            } catch (err) {
              Alert.alert('Error', `Could not delete product. ${err.message}`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  }

  function onEditPress(item) {
    setEditingId(item._id || item.id || null);
    setName(item.name || '');
    setPrice(item.price !== undefined && item.price !== null ? String(item.price) : '');
    setDescription(item.description || '');
    setImage(item.image || null); // load existing image into form when editing
  }

  function renderItem({ item }) {
    return (
      <View style={styles.item}>
        <Text style={styles.itemTitle}>{item.name || 'Unnamed'}</Text>
        {item.price !== undefined && item.price !== null ? (
          <Text style={styles.itemPrice}>{`\u20AC${item.price}`}</Text>
        ) : null}
        {item.description ? <Text style={styles.itemDesc}>{item.description}</Text> : null}
        {item.image && (
          <Image 
            source={{ uri: item.image }} 
            style={{ width: 100, height: 100, borderRadius: 6, marginTop: 10 }} 
          />
        )}  

        <View style={styles.itemButtons}>
          <View style={styles.buttonWrap}>
            <Button title="Edit" onPress={() => onEditPress(item)} />
          </View>
          <View style={styles.buttonWrap}>
            <Button title="Delete" color="#d9534f" onPress={() => deleteProduct(item._id || item.id)} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>ShopDemo Inventory — Add Product</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Price (optional)"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description (optional)"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <View style={styles.photoRow}>
        <Button
          title={image ? 'Retake Photo' : 'Take Photo'}
          onPress={takePhoto}
          disabled={posting}
        />
        <View style={styles.spacer} />
        {image ? (
          <Image source={{ uri: image }} style={styles.preview} />
        ) : null}
      </View>

      <View style={styles.buttonsRow}>
        <Button title={posting ? (editingId ? 'Saving...' : 'Adding...') : (editingId ? 'Save' : 'Add Product')} onPress={addProduct} disabled={posting} />
        <View style={styles.spacer} />
        <Button title="Refresh" onPress={fetchProducts} disabled={loading} />
      </View>

      <Text style={styles.header}>Products</Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item, idx) => item._id || item.id || String(idx)}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No products found.</Text>}
          contentContainerStyle={products.length === 0 ? styles.emptyContainer : null}
        />
      )}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    marginVertical: 6,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  preview: {
    width: 100,
    height: 100,
    borderRadius: 6,
    marginLeft: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  spacer: { width: 12 },
  item: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 6,
    marginVertical: 6,
  },
  itemTitle: { fontSize: 16, fontWeight: '600' },
  itemPrice: { color: '#333', marginTop: 4 },
  itemDesc: { color: '#666', marginTop: 6 },
  itemButtons: { flexDirection: 'row', marginTop: 10 },
  buttonWrap: { marginRight: 8 },
  empty: { textAlign: 'center', color: '#666', marginTop: 20 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
});